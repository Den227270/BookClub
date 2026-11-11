/* ============================================================
   Читаем вместе — script.js
   Отправка заявки в Google Sheets + мелкие улучшения UI
   ============================================================ */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyFXVaKsAhZd1DTesbNMQgGFcMxcmXN4Dw__EWy9Wo5g6ir22t16esEdnK1nnhHoA8R/exec";

/* ------------------------------------------------------------
   1. Прогресс скролла
   ------------------------------------------------------------ */
const progress = document.querySelector(".scroll-progress");

function updateProgress() {
  if (!progress) return;
  const h = document.documentElement;
  const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
  progress.style.width = Math.min(scrolled * 100, 100) + "%";
}

window.addEventListener("scroll", updateProgress, { passive: true });
updateProgress();

/* ------------------------------------------------------------
   2. Плавное появление блоков (reveal)
   ------------------------------------------------------------ */
const revealEls = document.querySelectorAll(
  ".feature, .book, .step, .review, .join, .section__head"
);

revealEls.forEach((el) => el.classList.add("reveal"));

const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
);

revealEls.forEach((el) => io.observe(el));

/* ------------------------------------------------------------
   3. Лёгкий «блик» на карточках-фичах при движении мыши
   ------------------------------------------------------------ */
document.querySelectorAll(".feature").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty("--mx", x + "%");
    card.style.setProperty("--my", y + "%");
  });
});

/* ------------------------------------------------------------
   4. Маска телефона (простая, без библиотек)
   ------------------------------------------------------------ */
const phoneInput = document.getElementById("phone");

if (phoneInput) {
  phoneInput.addEventListener("input", () => {
    let v = phoneInput.value.replace(/[^\d+()\-\s]/g, "");
    if (v.length > 18) v = v.slice(0, 18);
    phoneInput.value = v;
  });
}

/* ------------------------------------------------------------
   5. Отправка формы
   ------------------------------------------------------------ */
const form = document.getElementById("order-form");
const btn = document.getElementById("submit-btn");
const statusEl = document.getElementById("form-status");
const btnLabel = btn ? btn.querySelector(".btn__label") : null;

function setStatus(msg, type) {
  if (!statusEl) return;
  statusEl.textContent = msg;
  statusEl.className = "form__status" + (type ? " " + type : "");
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    plan: form.plan ? form.plan.value : "",
    comment: form.comment ? form.comment.value.trim() : "",
  };

  /* --- Валидация --- */
  if (data.name.length < 2) {
    setStatus("Пожалуйста, введите имя", "error");
    form.name.focus();
    return;
  }
  if (data.phone.replace(/\D/g, "").length < 10) {
    setStatus("Пожалуйста, введите корректный телефон", "error");
    form.phone.focus();
    return;
  }

  /* --- Блокируем кнопку --- */
  btn.disabled = true;
  if (btnLabel) btnLabel.textContent = "Отправляем…";
  setStatus("", "");

  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data),
    });

    setStatus("✅ Заявка отправлена! Свяжемся в течение 15 минут.", "success");
    form.reset();
  } catch (err) {
    console.error("Submit error:", err);
    setStatus("❌ Не удалось отправить. Попробуйте ещё раз.", "error");
  } finally {
    btn.disabled = false;
    if (btnLabel) btnLabel.textContent = "Отправить заявку";
  }
});
