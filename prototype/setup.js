import { signup } from "https://esm.sh/@netlify/identity@2.0.0";

const form = document.getElementById("signupForm");
const email = document.getElementById("signupEmail");
const password = document.getElementById("signupPassword");
const submit = document.getElementById("signupSubmit");
const message = document.getElementById("signupMessage");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
  submit.disabled = true;

  try {
    await signup(email.value.trim(), password.value);
    message.style.color = "#6dffb2";
    message.textContent = "Аккаунт создан. Проверь почту и подтверди email, затем войди на главной странице курса.";
    form.reset();
  } catch (error) {
    message.style.color = "#ff7d93";
    message.textContent = "Не получилось создать аккаунт: " + (error?.message || "ошибка");
  } finally {
    submit.disabled = false;
  }
});
