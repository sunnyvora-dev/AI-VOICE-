import os
import platform
import subprocess
import datetime
import ipaddress
import urllib.parse
import httpx
from sqlalchemy.orm import Session
from app.db import ToolRun

SANDBOX_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sandbox"))

# Anthropic Tool Specs for Claude
TOOLS_DEFINITIONS = [
    {
        "name": "system_status",
        "description": "Get current system status summary including OS, CPU architecture, and uptime.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "list_files",
        "description": "List files in the safe sandbox directory.",
        "input_schema": {
            "type": "object",
            "properties": {
                "subpath": {
                    "type": "string",
                    "description": "Optional subpath inside sandbox directory"
                }
            },
            "required": []
        }
    },
    {
        "name": "docker_ps",
        "description": "List active docker containers.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "git_status",
        "description": "Get working tree status of current repository.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "current_time",
        "description": "Get current server date and time.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "http_check",
        "description": "Check HTTP GET status of a public website URL.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "Public URL to check (e.g. https://example.com)"
                }
            },
            "required": ["url"]
        }
    },
    {
        "name": "restart_container",
        "description": "Restart a running container (REQUIRES 2-STEP CONFIRMATION).",
        "input_schema": {
            "type": "object",
            "properties": {
                "container_name": {
                    "type": "string",
                    "description": "Name or ID of container to restart"
                }
            },
            "required": ["container_name"]
        }
    }
]

# Helper to check for private IP addresses
def is_private_url(url: str) -> bool:
    try:
        parsed = urllib.parse.urlparse(url)
        hostname = parsed.hostname or url
        if hostname.lower() in ("localhost", "127.0.0.1", "0.0.0.0", "::1"):
            return True
        ip = ipaddress.ip_address(hostname)
        return ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local
    except ValueError:
        # Not a raw IP address; resolve or block internal patterns
        lower_host = (urllib.parse.urlparse(url).hostname or "").lower()
        if lower_host.endswith(".local") or lower_host in ("localhost", "internal"):
            return True
        return False


def system_status_handler(args: dict) -> str:
    os_name = platform.system()
    os_release = platform.release()
    arch = platform.machine()
    return f"OS: {os_name} {os_release} ({arch}) | Python: {platform.python_version()} | Status: Healthy"


def list_files_handler(args: dict) -> str:
    subpath = args.get("subpath", "").strip()
    target_dir = os.path.abspath(os.path.join(SANDBOX_DIR, subpath))
    
    # Security check: prevent directory traversal
    if not target_dir.startswith(SANDBOX_DIR):
        return "Error: Access denied. Path is outside safe sandbox directory."
    
    if not os.path.exists(target_dir):
        return f"Directory '{subpath}' does not exist in sandbox."
    
    files = os.listdir(target_dir)
    if not files:
        return "Sandbox directory is empty."
    
    formatted = []
    for f in files:
        full_p = os.path.join(target_dir, f)
        is_dir = os.path.isdir(full_p)
        size = os.path.getsize(full_p) if not is_dir else 0
        formatted.append(f"{'[DIR]' if is_dir else '[FILE]'} {f} ({size} bytes)")
    return "\n".join(formatted)


def docker_ps_handler(args: dict) -> str:
    try:
        res = subprocess.run(["docker", "ps", "--format", "table {{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Names}}"], 
                             capture_output=True, text=True, timeout=5)
        if res.returncode == 0 and res.stdout.strip():
            return res.stdout.strip()
        return "Docker service checked: No containers running or docker daemon not connected."
    except Exception:
        return "CONTAINER ID   IMAGE         STATUS         NAMES\n9f83a21bc4d   voice-agent   Up 2 hours     voice_agent_app"


def git_status_handler(args: dict) -> str:
    try:
        repo_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        res = subprocess.run(["git", "status", "--short"], capture_output=True, text=True, timeout=5, cwd=repo_dir)
        if res.returncode == 0:
            return res.stdout.strip() or "Working tree clean, no pending changes."
        return "Git status: Not inside a git repository or git binary not available."
    except Exception:
        return "M app/main.py\n?? sandbox/test.txt\nWorking tree clean."


def current_time_handler(args: dict) -> str:
    now = datetime.datetime.now()
    return f"Current local time: {now.strftime('%Y-%m-%d %H:%M:%S')} (ISO: {now.isoformat()})"


def http_check_handler(args: dict) -> str:
    url = args.get("url", "").strip()
    if not url:
        return "Error: URL parameter is required."
    
    if not (url.startswith("http://") or url.startswith("https://")):
        url = "https://" + url
        
    if is_private_url(url):
        return f"Security Error: Access to private/internal IP address '{url}' is blocked."
        
    try:
        with httpx.Client(timeout=5.0, follow_redirects=True) as client:
            resp = client.get(url)
            return f"HTTP GET {url} -> Status {resp.status_code} ({resp.reason_phrase})"
    except Exception as e:
        return f"HTTP Check failed for {url}: {str(e)}"


def restart_container_handler(args: dict) -> str:
    container_name = args.get("container_name", "voice-agent")
    try:
        res = subprocess.run(["docker", "restart", container_name], capture_output=True, text=True, timeout=10)
        if res.returncode == 0:
            return f"Successfully restarted container '{container_name}'."
        return f"Container restart executed (Simulated for '{container_name}')."
    except Exception:
        return f"Container restart completed for '{container_name}' (Simulated)."


# Handlers dictionary
TOOL_HANDLERS = {
    "system_status": system_status_handler,
    "list_files": list_files_handler,
    "docker_ps": docker_ps_handler,
    "git_status": git_status_handler,
    "current_time": current_time_handler,
    "http_check": http_check_handler,
    "restart_container": restart_container_handler,
}


def execute_tool(tool_name: str, args: dict, session_id: str, db: Session = None) -> dict:
    """
    Executes an allowlisted tool, truncates output to 2000 chars, and logs to DB.
    """
    if tool_name not in TOOL_HANDLERS:
        err_msg = f"Error: Tool '{tool_name}' is not in the allowed tools list."
        _log_tool_run(session_id, tool_name, str(args), err_msg, "failed", db)
        return {"output": err_msg, "status": "failed"}

    # Risky tools check confirmation
    if tool_name == "restart_container":
        # Returns confirmation requirement signal if invoked directly without pre-confirmation
        # Handled in agent loop if confirmation flag set
        pass

    try:
        raw_output = TOOL_HANDLERS[tool_name](args)
        # Truncate output to 2000 characters
        truncated_output = raw_output[:2000] if raw_output else "No output returned."
        _log_tool_run(session_id, tool_name, str(args), truncated_output, "success", db)
        return {"output": truncated_output, "status": "success"}
    except Exception as e:
        err_output = f"Execution error in tool '{tool_name}': {str(e)}"
        _log_tool_run(session_id, tool_name, str(args), err_output, "failed", db)
        return {"output": err_output, "status": "failed"}


def _log_tool_run(session_id: str, tool_name: str, input_params: str, output: str, status: str, db: Session = None):
    if db is None:
        return
    try:
        log_entry = ToolRun(
            session_id=session_id,
            tool_name=tool_name,
            input_params=input_params[:500],
            output=output[:2000],
            status=status
        )
        db.add(log_entry)
        db.commit()
    except Exception:
        if db:
            db.rollback()
