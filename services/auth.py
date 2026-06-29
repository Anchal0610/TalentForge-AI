import os
import json
import urllib.parse
import requests
import streamlit as st
from utils.logger import logger
from models.schemas import create_user, get_user_by_email, verify_user

# ---------------------------------------------------------------------------
# Google OAuth helpers
# ---------------------------------------------------------------------------
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8501")


def is_configured():
    return bool(CLIENT_ID and CLIENT_SECRET and CLIENT_ID != "your_google_client_id_here")


def _get_google_auth_url():
    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    return "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)


def _exchange_code(code):
    data = {
        "code": code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    resp = requests.post("https://oauth2.googleapis.com/token", data=data, timeout=10)
    resp.raise_for_status()
    return resp.json()


def _get_google_user(access_token):
    resp = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


# ---------------------------------------------------------------------------
# Session helpers
# ---------------------------------------------------------------------------
def is_logged_in():
    return st.session_state.get("user") is not None


def get_user():
    return st.session_state.get("user")


def logout():
    st.session_state.pop("user", None)
    st.session_state.pop("oauth_state", None)


def handle_oauth_redirect():
    params = st.query_params
    if "code" in params and "state" not in params:
        try:
            token_data = _exchange_code(params["code"])
            google_user = _get_google_user(token_data["access_token"])
            email = google_user["email"]
            existing = get_user_by_email(email)
            if not existing:
                create_user(
                    email=email,
                    name=google_user.get("name"),
                    picture=google_user.get("picture"),
                    auth_provider="google",
                )
                existing = get_user_by_email(email)
            st.session_state["user"] = existing
            st.query_params.clear()
            st.rerun()
        except Exception as e:
            logger.error(f"OAuth callback failed: {e}")



def login_button():
    if not is_configured():
        st.warning("Google OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env")
        return
    auth_url = _get_google_auth_url()
    st.markdown(
        f'<a href="{auth_url}" target="_self">'
        f'<button style="width:100%;padding:10px;border-radius:8px;border:1px solid #3B82F6;background:transparent;color:#E2E8F0;cursor:pointer;font-size:16px;">'
        f"Sign in with Google</button></a>",
        unsafe_allow_html=True,
    )


# ---------------------------------------------------------------------------
# Email / Password helpers
# ---------------------------------------------------------------------------
def login_with_email(email, password):
    user = verify_user(email, password)
    if user:
        st.session_state["user"] = user
        return True
    return False


def register_with_email(email, password, name):
    existing = get_user_by_email(email)
    if existing:
        return False, "Email already registered"
    user_id = create_user(email=email, password=password, name=name, auth_provider="email")
    if user_id:
        user = get_user_by_email(email)
        st.session_state["user"] = user
        return True, "Registration successful"
    return False, "Registration failed"
