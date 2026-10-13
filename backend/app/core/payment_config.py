import os
from pathlib import Path

from dotenv import load_dotenv


# RetailIQ project root:
# D:\AI-Retail-Intelligence\RetailIQ
PROJECT_ROOT = Path(__file__).resolve().parents[3]

ENV_FILE = PROJECT_ROOT / ".env"

load_dotenv(ENV_FILE)


RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "").strip()

RAZORPAY_KEY_SECRET = os.getenv(
    "RAZORPAY_KEY_SECRET",
    "",
).strip()


def validate_razorpay_config() -> None:
    """Ensure Razorpay credentials exist before initiating payments."""

    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise RuntimeError(
            "Razorpay credentials are missing. "
            "Configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET "
            "in the project .env file."
        )