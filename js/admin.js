const HOY = new Date()

function fechaClave() {
  return HOY.getFullYear() + "-" + (HOY.getMonth() + 1) + "-" + HOY.getDate()
}

document.getElementById("fecha-admin").innerText =
  HOY.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })

/* ── Toast ── */
function mostrarToast(msg) {
  const t = document.getElementById("toast")
  t.textContent = msg
  t.classList.add("show")
  setTimeout(() => t.classList.remove("show"), 2500)
}

/* ── Tabs ── */
function cambiarTab(tab) {
  ["menus", "pedidos", "config"].forEach((t, i) => {
    document.querySelectorAll(".tab")[i].classList.toggle("active", t === tab)
    document.getElementById("panel-" + t).classList.toggle("show", t === tab)
  })
  if (tab === "pedidos") escucharPedidos()
}

/* ── Menús ── */
function guardarMenus() {
  const m1 = document.getElementById("m1-nombre").value.trim()
  const m2 = document.getElementById("m2-nombre").value.trim()

  if (!m1 || !m2) {
    mostrarToast("Completá los dos menús")
    return
  }

  const menus = {
    menu1: {
      nombre: m1,
      descripcion: document.getElementById("m1-desc").value.trim(),
      precio: document.getElementById("m1-precio").value.trim()
    },
    menu2: {
      nombre: m2,
      descripcion: document.getElementById("m2-desc").value.trim(),
      precio: document.getElementById("m2-precio").value.trim()
    }
  }

  database.ref("menus/" + fechaClave()).set(menus)
  mostrarToast("Menús guardados")
  verificarEstadoHoy()
}

function verificarEstadoHoy() {
  database.ref("menus/" + fechaClave()).once("value", snap => {
    const data = snap.val()
    const box = document.getElementById("estado-hoy-box")

    if (data) {
      box.innerHTML = '<div class="estado-hoy ok">Menús cargados</div>'
      document.getElementById("m1-nombre").value = data.menu1.nombre
      document.getElementById("m1-desc").value = data.menu1.descripcion
      document.getElementById("m1-precio").value = data.menu1.precio || ""
      document.getElementById("m2-nombre").value = data.menu2.nombre
      document.getElementById("m2-desc").value = data.menu2.descripcion
      document.getElementById("m2-precio").value = data.menu2.precio || ""
    } else {
      box.innerHTML = '<div class="estado-hoy vacio">No cargaste menús hoy</div>'
    }
  })
}

/* ── Pedidos ── */
function escucharPedidos() {
  database.ref("pedidos/" + fechaClave()).on("value", snap => {
    const data = snap.val()

    if (!data) {
      document.getElementById("lista-pedidos").innerHTML =
        '<div class="sin-pedidos">Sin pedidos</div>'
      return
    }

    const pedidos = Object.values(data)

    document.getElementById("lista-pedidos").innerHTML =
      pedidos.reverse().map(p => {
        // menus es un array de { menu, cantidad }
        const itemsTexto = Array.isArray(p.menus)
          ? p.menus.map(m => `${m.cantidad}x ${m.menu}`).join(", ")
          : p.menu || "-"

        return `
          <div class="pedido-item">
            <div class="pedido-top">
              <div class="pedido-nombre">${p.nombre}</div>
              <div class="pedido-hora">${p.hora}</div>
            </div>
            <div class="pedido-menu">${itemsTexto}</div>
            <div class="pedido-entrega">${p.entrega === "delivery" ? "🛵 Delivery" : "🏪 Retiro"}</div>
            ${p.entrega === "delivery"
              ? `<div class="pedido-dir">${p.direccion}</div>`
              : ""}
          </div>
        `
      }).join("")
  })
}

/* ── Config ── */
function guardarNombre() {
  const n = document.getElementById("config-nombre").value.trim()
  if (!n) return
  database.ref("config/nombre").set(n)
  mostrarToast("Nombre guardado")
}

function guardarWA() {
  const wa = document.getElementById("config-wa").value.trim()
  if (!wa) return
  database.ref("config/whatsapp").set(wa)
  mostrarToast("WhatsApp guardado")
}

function cargarConfig() {
  database.ref("config").once("value", snap => {
    const data = snap.val()
    if (!data) return
    if (data.nombre) document.getElementById("config-nombre").value = data.nombre
    if (data.whatsapp) document.getElementById("config-wa").value = data.whatsapp
  })
}

/* ── Inicio ── */
verificarEstadoHoy()
cargarConfig()