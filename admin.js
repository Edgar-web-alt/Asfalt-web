const tbody = document.querySelector("tbody");
const status = document.querySelector("#admin-status");
const refreshButton = document.querySelector("#refresh");

async function loadRequests() {
  if (!tbody || !status || !refreshButton) {
    console.error("Admin HTML-ում անհրաժեշտ տարրերը չեն գտնվել։");
    return;
  }

  status.textContent = "Загрузка заявок...";
  refreshButton.disabled = true;

  try {
    const response = await fetch("/api/requests", {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }

    const requests = await response.json();

    if (!Array.isArray(requests)) {
      throw new Error("Сервер вернул неверный формат данных.");
    }

    tbody.replaceChildren();

    requests.slice().reverse().forEach((request) => {
      const tr = document.createElement("tr");

      const values = [
        request.name || "—",
        request.phone || "—",
        request.service || "—",
        request.details || "—",
        request.createdAt
          ? new Date(request.createdAt).toLocaleString("ru-RU")
          : "—",
      ];

      values.forEach((value) => {
        const td = document.createElement("td");

        td.textContent = value;
        td.style.padding = "12px";
        td.style.borderBottom = "1px solid #303840";

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    status.textContent = requests.length
      ? `Всего заявок: ${requests.length}`
      : "Пока заявок нет.";
  } catch (error) {
    status.textContent = "Не удалось загрузить заявки.";
    console.error("Ошибка загрузки заявок:", error);
  } finally {
    refreshButton.disabled = false;
  }
}

refreshButton?.addEventListener("click", loadRequests);

loadRequests();

// Автоматическое обновление каждые 5 секунд
setInterval(loadRequests, 5000);