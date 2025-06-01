<template>
  <div class="login-component">
    <div class="main-wrapper">
      <div class="logo">Codecaine</div>
      <div class="header">Log In</div>
    </div>

    <div class="container">
      <div class="left">
        <button class="social-btn">
          
          <GoogleIcon />
          Log In with Google
        </button>

        <button class="social-btn">
          
            <GithubIcon />

          Log In with GitHub
        </button>

        <div class="info-wrapper" :class="{ open: infoOpen }">
          <div class="info-summary" @click="toggleInfo">
            How social log in works
          </div>
          <div class="info-content" ref="infoContent">
            <p>
              If the email address associated with your social account matches the email address of your CodePen account, you'll be logged in. You aren't locked to any particular social account. Questions?
              <a href="#">contact support</a>.
            </p>
          </div>
        </div>
      </div>

      <div class="divider">
        <span>OR</span>
      </div>

      <div class="right">
        <form>
          <div class="form-group">
            <label for="username">Username or Email</label>
            <input id="username" type="text" placeholder="Username or Email" />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" placeholder="Password" />
          </div>
          <button type="submit" class="btn-primary">Log In</button>
        </form>

        <div class="forgot">
          <a href="#" @click.prevent="toggleReset">Forgot Password?</a>
        </div>

        <div id="reset-box" :class="{ show: resetOpen }" ref="resetBox">
          <h2>Reset Your Password</h2>
          <form>
            <div class="form-group">
              <label for="reset-email">Username Or Email</label>
              <input id="reset-email" type="text" placeholder="your@email.com" />
            </div>
            <button type="button" class="btn-secondary">Send Password Reset Email</button>
          </form>
        </div>
      </div>
    </div>

    <footer class="signup-footer">
      <div class="signup">
        Need an account? <a href="#">Sign up now!</a>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';

import GoogleIcon from './icons/GoogleIcon.vue';
import GithubIcon from './icons/GithubIcon.vue';


const infoOpen = ref(false);
const infoContent = ref(null);

const resetOpen = ref(false);
const resetBox = ref(null);

const toggleInfo = () => {
  if (!infoOpen.value) {
    infoOpen.value = true;
    nextTick(() => {
      const el = infoContent.value;
      el.style.maxHeight = el.scrollHeight + 'px';
      el.style.opacity = '1';
    });
  } else {
    const el = infoContent.value;
    el.style.maxHeight = '0';
    el.style.opacity = '0';
    setTimeout(() => {
      infoOpen.value = false;
    }, 500);
  }
};

const toggleReset = () => {
  resetOpen.value = !resetOpen.value;
  nextTick(() => {
    const el = resetBox.value;
    if (resetOpen.value) {
      el.style.maxHeight = el.scrollHeight + 'px';
      el.style.opacity = '1';
    } else {
      el.style.maxHeight = '0';
      el.style.opacity = '0';
    }
  });
};
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.login-component {
  font-family: 'Segoe UI', Tahoma, sans-serif;
  background-color: #1e1f26;
  color: #ececf1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
}

.main-wrapper {
  max-width: 960px;
  width: 100%;
  padding-left: 64px;
  padding-right: 0;
  margin-bottom: 1.5rem;
}
.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #fff;
  letter-spacing: 1px;
  user-select: none;
  margin-bottom: 0.25rem;
  text-align: left;
}
.header {
  font-size: 4.5rem;
  font-weight: 700;
  user-select: none;
  text-align: left;
  margin-bottom: 0;
}

.container {
  display: flex;
  max-width: 960px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  padding-left: 32px;
  padding-right: 32px;
}
.left,
.divider,
.right {
  padding: 2rem;
}
.left {
  flex: 1;
}

.social-btn {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  background: #b3b4ba;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}
.social-btn svg {
  width: 20px;
  height: 20px;
  margin-right: 0.75rem;
}
.social-btn:hover {
  background: #4b4e5a;
}

.info-wrapper {
  width: 75%;
  margin-top: 1rem;
  border-radius: 4px;
  overflow: hidden;
  background: none;
  transition: background 0.3s ease;
}
.info-wrapper.open {
  background: #323444;
}
.info-summary {
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  line-height: 1.4;
  padding: 0.5rem 1rem;
  position: relative;
  user-select: none;
}
.info-summary::before {
  content: "▸";
  display: inline-block;
  font-size: 2rem;
  margin-right: 0.5rem;
  vertical-align: middle;
  transition: transform 0.3s ease;
  position: relative;
  top: -2px;
}
.info-wrapper.open .info-summary::before {
  transform: rotate(90deg);
}
.info-summary:hover {
  color: #cccccc;
}
.info-content {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  padding: 0 1rem;
  transition: max-height 0.5s ease, opacity 0.5s ease, padding 0.3s ease;
}
.info-wrapper.open .info-content {
  opacity: 1;
  padding: 0 1rem 1rem 1rem;
}
.info-content p {
  margin: 0;
  padding-bottom: 1rem;
  line-height: 1.4;
  font-size: 0.9rem;
}
.info-content a {
  color: lightblue;
  text-decoration: underline;
}
.info-content a:hover {
  color: #ffffff;
}

.divider {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  width: 2rem;
  background: #1e1f26;
}
.divider::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  background: #444;
}
.divider span {
  position: absolute;
  width: 46px;
  height: 18%;
  left: calc(50% - 23px);
  top: 41%;
  border: 2px solid #444;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  font-size: 1.2rem;
  line-height: 30px;
  background: #1e1f26;
  color: #ccc;
}

.right {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 2rem;
}
.right h2 {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1rem;
}
.form-group {
  margin-bottom: 1.25rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}
.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  background: #b3b4ba;
  color: #fff;
  font-size: 1rem;
}
.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background: #38c172;
  border: none;
  border-radius: 4px;
  color: #1e1f26;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-primary:hover {
  background: #2fa055;
}

.forgot {
  text-align: center;
  margin: 0.75rem 0;
  font-size: 0.9rem;
}
.forgot a {
  color: #38c172;
  text-decoration: none;
  cursor: pointer;
}

#reset-box {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-height 0.5s ease, opacity 0.5s ease;
  background: #323444;
  border-radius: 4px;
  padding: 0 1.5rem;
  margin-top: 0;
}
#reset-box.show {
  max-height: 300px;
  opacity: 1;
  padding: 1.5rem;
  margin-top: 1.5rem;
}
#reset-box h2 {
  margin-top: 0;
}
.btn-secondary {
  width: 100%;
  padding: 0.75rem;
  background: #3a3c46;
  color: #ececf1;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-secondary:hover {
  background: #4b4e5a;
}

.signup-footer {
  max-width: 960px;
  width: 100%;
  padding: 1rem 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1rem;
}
.signup-footer .signup {
  font-size: 0.9rem;
  color: #ececf1;
}
.signup-footer .signup a {
  color: #38c172;
  text-decoration: none;
  font-weight: 500;
}
.signup a {
  color: lightblue !important;
}
.signup a:hover {
  color: #ffffff !important;
}
.forgot a {
  color: lightblue !important;
}
.forgot a:hover {
  color: #ffffff !important;
}
</style>
