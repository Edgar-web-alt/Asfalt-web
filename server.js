
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;

const dir = path.dirname(fileURLToPath(import.meta.url));
const requests = [];

// CORS և Middleware
app.use(
  cors({
    origin: [
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "http://localhost:3000",
    ],
  })
);

app.use(express.json());
app.use(express.static(dir));

// SMS ուղարկել ադմինիստրատորին
async function sendAdminSMS(request) {
  const apiId = process.env.SMS_RU_API_ID;
  const phone = process.env.ADMIN_PHONE;

  if (!apiId || !phone) {
    console.error("SMS.RU: проверьте настройки .env");
    return;
  }

  const message = [
    "ASPHALTPRO: Новая заявка!",
    `Имя: ${request.name}`,
    `Телефон: ${request.phone}`,
    `Услуга: ${request.service}`,
  ].join("\n");

  const params = new URLSearchParams({
    api_id: apiId,
    to: phone,
    msg: message,
    json: "1",
  });

  try {
    const response = await fetch("https://sms.ru/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      signal: AbortSignal.timeout(15000),
    });

    const result = await response.json();

    if (!response.ok || result.status !== "OK") {
      console.error("SMS.RU:", result.status_text || response.status);
      return;
    }

    const sms = result.sms?.[phone];

    if (sms?.status === "OK") {
      console.log("SMS принято к отправке. ID:", sms.sms_id);
    } else {
      console.error(
        "SMS не отправлено:",
        sms?.status_text || sms?.status || "Неизвестная ошибка"
      );
    }
  } catch (error) {
    console.error("Ошибка отправки SMS:", error.message);
  }
}

// Ստուգել API-ն
app.get("/api/health", (req, res) => {
  res.status(200).json({
    message: "API ASPHALTPRO работает",
  });
});

// Ընդունել հայտերը
app.post("/api/requests", (req, res) => {
  const { name, phone, service, details = "" } = req.body || {};

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof phone !== "string" ||
    !phone.trim() ||
    typeof service !== "string" ||
    !service.trim()
  ) {
    return res.status(400).json({
      message: "Имя, телефон и услуга обязательны.",
    });
  }

  const item = {
    id: Date.now(),
    name: name.trim(),
    phone: phone.trim(),
    service: service.trim(),
    details: typeof details === "string" ? details.trim() : "",
    createdAt: new Date().toISOString(),
  };

  requests.push(item);

  console.log("Новая заявка:", item);

  void sendAdminSMS(item);

  return res.status(201).json({
    message: "Заявка успешно принята.",
    id: item.id,
  });
});

// Admin panel-ի հայտերը
app.get("/api/requests", (req, res) => {
  res.status(200).json(requests);
});

// Գլխավոր էջ
app.get("/", (req, res) => {
  res.sendFile(path.join(dir, "index.html"));
});

// Admin panel
app.get("/admin", (req, res) => {
  res.sendFile(path.join(dir, "admin.html"));
});

// Չգտնված հասցեներ
app.use((req, res) => {
  res.status(404).json({
    message: "Маршрут не найден.",
    path: req.path,
  });
});

// Գործարկել սերվերը
app.listen(PORT, () => {
  console.log(`ASPHALTPRO: http://localhost:${PORT}`);
  console.log(`Проверка API: http://localhost:${PORT}/api/health`);
  console.log(`Админ-панель: http://localhost:${PORT}/admin`);
});
