import os
import streamlit as st
import requests
from urllib.parse import urlencode
from dotenv import load_dotenv

load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8501")
GOOGLE_AUTH_URL = os.getenv("GOOGLE_AUTH_URL", "https://accounts.google.com/o/oauth2/v2/auth")
GOOGLE_TOKEN_URL = os.getenv("GOOGLE_TOKEN_URL", "https://oauth2.googleapis.com/token")
GOOGLE_USERINFO_URL = os.getenv("GOOGLE_USERINFO_URL", "https://www.googleapis.com/oauth2/v1/userinfo")
SCOPE = os.getenv("GOOGLE_SCOPE", "openid email profile")


def is_configured():
    return bool(GOOGLE_CLIENT_ID) and GOOGLE_CLIENT_ID != "your_google_client_id_here"


def get_auth_url():
    state = os.urandom(16).hex()
    st.session_state["oauth_state"] = state

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPE,
        "state": state,
        "access_type": "offline",
        "prompt": "consent",
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


def handle_callback():
    params = st.query_params
    code = params.get("code")
    state = params.get("state")

    if not code or not state:
        return None

    if isinstance(code, list):
        code = code[0]
    if isinstance(state, list):
        state = state[0]

    saved_state = st.session_state.get("oauth_state")
    if saved_state and state != saved_state:
        st.error("Security mismatch. Please try again.")
        return None

    token_data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    resp = requests.post(GOOGLE_TOKEN_URL, data=token_data)
    if not resp.ok:
        st.error("Failed to authenticate with Google.")
        return None

    tokens = resp.json()
    access_token = tokens.get("access_token")
    if not access_token:
        st.error("No access token received.")
        return None

    user_resp = requests.get(
        GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"}
    )
    if not user_resp.ok:
        st.error("Failed to fetch user info.")
        return None

    user_info = user_resp.json()
    return {
        "name": user_info.get("name", user_info.get("email", "User")),
        "email": user_info.get("email", ""),
        "picture": user_info.get("picture", ""),
    }


def render_login_page():
    col1, col2, col3 = st.columns([1, 2, 1])

    with col2:
        st.markdown("""
        <div style="text-align: center; margin-top: 3rem; margin-bottom: 2rem;">
            <h1 style="font-size: 3rem; margin-bottom: 0.2rem;">Nexora AI</h1>
            <p style="font-size: 1rem; color: #94A3B8; font-weight: 300;">
                Career Intelligence Platform
            </p>
        </div>
        """, unsafe_allow_html=True)

        st.markdown("""
        <div style="max-width: 420px; margin: 0 auto; text-align: center;
            background: rgba(15, 23, 42, 0.45);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px; padding: 32px 24px;
            backdrop-filter: blur(12px);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);">
            <div style="margin-bottom: 1.5rem;">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">Nexora</div>
                <h3>Welcome Back</h3>
                <p style="color: #94A3B8; font-size: 0.9rem;">Sign in to continue to Nexora AI</p>
            </div>
        </div>
        """, unsafe_allow_html=True)

        if is_configured():
            auth_url = get_auth_url()
            st.markdown(
                f'<div style="text-align: center; margin-top: 1rem;">'
                f'<a href="{auth_url}" target="_self" style="display: inline-flex; align-items: center; gap: 10px; '
                f'background: #fff; color: #333; padding: 12px 24px; border-radius: 8px; '
                f'text-decoration: none; font-weight: 600; font-size: 1rem; '
                f'box-shadow: 0 2px 8px rgba(0,0,0,0.2);">'
                f'<img src="https://www.google.com/favicon.ico" width="20" height="20" style="vertical-align: middle;">'
                f'Sign in with Google'
                f'</a></div>',
                unsafe_allow_html=True
            )
        else:
            st.info("Google OAuth not configured. Use dev login below.")
            with st.form("dev_login"):
                name = st.text_input("Name", value="Demo User")
                email = st.text_input("Email", value="demo@example.com")
                if st.form_submit_button("Enter App", type="primary"):
                    st.session_state["user"] = {"name": name, "email": email, "picture": ""}
                    st.rerun()

        st.markdown("""
        <div style="text-align: center; margin-top: 2rem;">
            <p style="color: #64748B; font-size: 0.75rem;">
                By signing in, you agree to our Terms of Service
            </p>
        </div>
        """, unsafe_allow_html=True)


def render_logout():
    user = st.session_state.get("user", {})
    col1, col2 = st.columns([3, 1])
    with col1:
        st.markdown(f"**Signed in as:** {user.get('name', 'User')}")
        st.caption(user.get("email", ""))
    with col2:
        if st.button("Logout", use_container_width=True):
            del st.session_state["user"]
            st.rerun()
    st.divider()
