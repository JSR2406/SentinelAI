import tempfile
import os
from app.scanners.gitleaks import GitleaksScanner
from app.scanners.semgrep import SemgrepScanner
from app.scanners.normalizer import OutputNormalizer, run_all_scanners_and_normalize

def test_gitleaks_and_semgrep_fallback_scanners():
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create a mock file with secret and eval call
        vuln_file = os.path.join(temp_dir, "app.py")
        with open(vuln_file, "w", encoding="utf-8") as f:
            f.write("AWS_KEY = 'AKIA1234567890ABCDEF'\n")
            f.write("eval('user_input')\n")

        # Run Gitleaks scanner
        gitleaks_res = GitleaksScanner().run(temp_dir)
        assert len(gitleaks_res) >= 1

        # Run Semgrep scanner
        semgrep_res = SemgrepScanner().run(temp_dir)
        assert len(semgrep_res) >= 1

        # Run full normalizer
        issues = run_all_scanners_and_normalize(temp_dir, "test-scan-id")
        assert len(issues) >= 2
        tools = [i.tool for i in issues]
        assert "Gitleaks" in tools or "Semgrep" in tools
