import os
import json
import streamlit as st
from typing import Optional, Dict
from dotenv import load_dotenv
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from utils.logger import logger

load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "").strip("'\"")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "").strip("'\"")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8501").strip("'\"")

SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]


def get_redirect_uri() -> str:
    base = GOOGLE_REDIRECT_URI
    if not base.endswith("/"):
        base += "/"
    return base


def is_configured() -> bool:
    return bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET and
                GOOGLE_CLIENT_ID != "your_google_client_id_here" and
                GOOGLE_CLIENT_SECRET != "your_google_client_secret_here")


def create_flow() -> Optional[Flow]:
    if not is_configured():
        return None
    client_config = {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [GOOGLE_REDIRECT_URI],
        }
    }
    flow = Flow.from_client_config(client_config, scopes=SCOPES)
    flow.redirect_uri = GOOGLE_REDIRECT_URI
    return flow


def get_auth_url() -> Optional[str]:
    flow = create_flow()
    if not flow:
        return None
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="select_account",
    )
    return auth_url


def handle_callback(auth_code: str) -> Optional[Dict[str, str]]:
    flow = create_flow()
    if not flow:
        return None
    try:
        flow.fetch_token(code=auth_code)
        credentials = flow.credentials
        if not credentials.valid:
            credentials.refresh(Request())
        user_info = _get_user_info(credentials)
        return user_info
    except Exception as e:
        logger.error(f"Google OAuth callback failed: {str(e)}")
        return None


def _get_user_info(credentials) -> Optional[Dict[str, str]]:
    import requests
    try:
        headers = {"Authorization": f"Bearer {credentials.token}"}
        resp = requests.get("https://www.googleapis.com/oauth2/v2/userinfo", headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            return {
                "id": data.get("id"),
                "email": data.get("email"),
                "name": data.get("name"),
                "picture": data.get("picture"),
            }
        logger.error(f"Failed to fetch user info: {resp.status_code} {resp.text}")
        return None
    except Exception as e:
        logger.error(f"Error fetching user info: {str(e)}")
        return None


def init_session_state():
    if "user" not in st.session_state:
        st.session_state["user"] = None
    if "oauth_code_processed" not in st.session_state:
        st.session_state["oauth_code_processed"] = False


def handle_oauth_redirect():
    init_session_state()
    if st.session_state.get("user"):
        return

    try:
        query_params = st.query_params
    except AttributeError:
        query_params = st.experimental_get_query_params()

    auth_code = query_params.get("code")
    state = query_params.get("state")

    if auth_code and not st.session_state.get("oauth_code_processed"):
        st.session_state["oauth_code_processed"] = True
        if isinstance(auth_code, list):
            auth_code = auth_code[0]
        user_info = handle_callback(auth_code)
        if user_info:
            st.session_state["user"] = user_info
            logger.info(f"User logged in: {user_info.get('email')}")
        try:
            st.query_params.clear()
        except Exception:
            pass


def login_button():
    if not is_configured():
        st.warning("Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env")
        return
    auth_url = get_auth_url()
    if auth_url:
        st.markdown(
            f'<a href="{auth_url}" target="_self">'
            f'<button style="background:white;color:#333;border:1px solid #ddd;padding:10px 20px;'
            f'border-radius:6px;font-size:16px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;">'
            f'<img src="https://www.google.com/favicon.ico" width="18" height="18" style="vertical-align:middle;">'
            f' Sign in with Google'
            f'</button></a>',
            unsafe_allow_html=True,
        )


def logout():
    st.session_state["user"] = None
    st.session_state["oauth_code_processed"] = False


def get_user() -> Optional[Dict[str, str]]:
    init_session_state()
    return st.session_state.get("user")


def is_logged_in() -> bool:
    return get_user() is not None
