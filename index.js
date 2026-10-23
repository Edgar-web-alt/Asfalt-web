const API_URL = "http://localhost:3000";

const menu = document.querySelector("#menu");
const nav = document.querySelector("#nav");

const form = document.querySelector("#contact-form");
const status = document.querySelector("#status");
const year = document.querySelector("#year");

// Год в подвале сайта
if (year) {
  year.textContent = new Date().getFullYear();
}

// Мобильное меню
menu?.addEventListener("click", () => {
  const isOpen = nav?.classList.toggle("open") ?? false;

  menu.setAttribute("aria-expanded", String(isOpen));
  menu.setAttribute(
    "aria-label",
    isOpen ? "Закрыть меню" : "Открыть меню"
  );
});

// Закрытие меню после перехода по ссылке
nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");

    menu?.setAttribute("aria-expanded", "false");
    menu?.setAttribute("aria-label", "Открыть меню");
  });
});

// Отправка заявки
form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!status) return;

  status  .textContent = "Отправка заявки...";

  const submitButton = form.querySelector('button[type="submit"]');

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Отправка...";
  }

  const data = Object.fromEntries(new FormData(form));

  try {
    const response = await fetch(`${API_URL}/api/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseText = await response.text();

    let result = {};

    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Некорректный ответ сервера. HTTP ${response.status}: ${responseText.slice(0, 150)}`
        );
      }
    }

    if (!response.ok) {
      throw new Error(
        result.message || `Ошибка сервера: ${response.status}`
      );
    }

    if (!responseText) {
      throw new Error("Сервер вернул пустой ответ.");
    }

    status.textContent = "Заявка успешно отправлена. Спасибо!";
    form.reset();
  } catch (error) {
    console.error("Ошибка отправки заявки:", error);
    status.textContent = `Ошибка: ${error.message}`;
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Отправить заявку ↗";
    }
  }
});
