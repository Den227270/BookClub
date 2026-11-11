/* ============================================================
   Бронированная отправка в Google Sheets
   - fetch + text/plain (обходит CORS)
   - + fallback через скрытый iframe (если fetch заблокирован)
   ============================================================ */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzia9zhcwOdTaV_mfmlqT5EoYk1V83x4Cg1CnwjoMhzmhaWj6rK4yGEJQTRkeJkL6ZR/exec";

const form = document.getElementById("order-form");
const btn = document.getElementById("submit-btn");
const statusEl = document.getElementById("form-status");

/* ---------- Утилита: показать статус ---------- */
function setStatus(msg, type) {
  if (!statusEl) return;
  statusEl.textContent = msg;
  statusEl.className = "form__status" + (type ? " " + type : "");
}

/* ---------- Утилита: валидация ---------- */
function validate(data) {
  if (data.name.length < 2) {
    setStatus("Введите имя (минимум 2 символа)", "error");
    return false;
  }
  if (data.phone.replace(/\D/g, "").length < 10) {
    setStatus("Введите корректный телефон", "error");
    return false;
  }
  return true;
}

/* ---------- Способ 1: fetch (основной) ---------- */
async function sendViaFetch(data) {
  await fetch(SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(data),
  });
}

/* ---------- Способ 2: скрытый iframe (резервный) ---------- */
function sendViaIframe(data) {
  return new Promise((resolve) => {
    const iframeName = "gs_hidden_" + Date.now();
    const iframe = document.createElement("iframe");
    iframe.name = iframeName;
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const innerForm = document.createElement("form");
    innerForm.method = "POST";
    innerForm.action = SCRIPT_URL;
    innerForm.target = iframeName;
    innerForm.style.display = "none";

    // Отправляем те же поля, что и в fetch, но как form-data
    Object.keys(data).forEach((key) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = data[key];
      innerForm.appendChild(input);
    });

    document.body.appendChild(innerForm);
    innerForm.submit();

    // Ждём загрузку iframe (запрос ушёл)
    iframe.onload = () => {
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
        if (document.body.contains(innerForm)) document.body.removeChild(innerForm);
        resolve();
      }, 1000);
    };
  });
}

/* ---------- Основной обработчик ---------- */
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      name: (form.name?.value || "").trim(),
      phone: (form.phone?.value || "").trim(),
      plan: (form.plan?.value || "").trim(),
      comment: (form.comment?.value || "").trim(),
    };

    if (!validate(data)) return;

    // Блокируем кнопку
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Отправляем...";
    }
    setStatus("", "");

    try {
      // Пробуем fetch
      await sendViaFetch(data);
      setStatus("✅ Заявка отправлена!", "success");
      form.reset();
    } catch (fetchError) {
      console.warn("Fetch не сработал, пробуем iframe...", fetchError);

      // Если fetch упал — пробуем iframe
      try {
        await sendViaIframe(data);
        setStatus("✅ Заявка отправлена (резервный способ)", "success");
        form.reset();
      } catch (iframeError) {
        console.error("Оба способа не сработали:", iframeError);
        setStatus("❌ Ошибка отправки. Позвоните: +7 (999) 555-22-11", "error");
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Отправить заявку";
      }
    }
  });
}
