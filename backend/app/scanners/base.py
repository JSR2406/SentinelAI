import subprocess
import json
import os
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class BaseScanner:
    name: str = "BaseScanner"

    def run(self, repo_path: str) -> List[Dict[str, Any]]:
        """Runs scanner on repo_path and returns list of raw JSON finding objects."""
        raise NotImplementedError

    def execute_command(self, cmd: List[str], cwd: str, timeout: int = 300) -> Optional[str]:
        """Executes CLI command safely with timeout."""
        import shutil
        if not shutil.which(cmd[0]):
            logger.info(f"Scanner binary {cmd[0]} not found in PATH. Using fallback analyzer.")
            return None
        try:
            logger.info(f"Executing scanner command: {' '.join(cmd)}")
            result = subprocess.run(
                cmd,
                cwd=cwd,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            return result.stdout
        except subprocess.TimeoutExpired:
            logger.error(f"Scanner command timed out after {timeout} seconds: {' '.join(cmd)}")
            return None
        except (FileNotFoundError, Exception) as e:
            logger.warning(f"Scanner command failed or not installed ({e}): {' '.join(cmd)}")
            return None
