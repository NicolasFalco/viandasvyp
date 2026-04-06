/* ── Estado global ── */
let menusFirebase = []
let fechaMenuActual = null
let seleccion = [
  { seleccionado: false, cantidad: 1 },
  { seleccionado: false, cantidad: 1 }
]
let entregaSeleccionada = null

/* ── Helpers de fecha ── */
function horaArgentina() {
  const ahora = new Date()
  return new Date(ahora.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }))
}

function claveFecha(d) {
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate()
}

/* ── Fecha visible en el header ── */
const horaAR = horaArgentina()
document.getElementById("fecha-hoy").innerText =
  horaAR.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })

/* ── Carga de menús ── */
function cargarMenus() {
  const ahora = horaArgentina()
  const hora = ahora.getHours()

  if (hora >= 13 && hora < 20) {
    document.getElementById("menus-container").innerHTML =
      '<div class="no-menu">🕙 Los pedidos están disponibles<br>de 20:00 a 13:00 hs</div>'
    return
  }

  const fechaMenu = new Date(ahora)
  if (hora >= 20) {
    fechaMenu.setDate(fechaMenu.getDate() + 1)
  }

  fechaMenuActual = fechaMenu

  database.ref("menus/" + claveFecha(fechaMenu)).on("value", snap => {
    const data = snap.val()
    if (!data) {
      document.getElementById("menus-container").innerHTML =
        '<div class="no-menu">Menú no disponible</div>'
      return
    }
    menusFirebase = [data.menu1, data.menu2]
    renderMenus()
  })
}

/* ── Render de tarjetas de menú ── */
function renderMenus() {
  document.getElementById("menus-container").innerHTML =
    menusFirebase.map((m, i) => `
      <div class="menu-card${seleccion[i].seleccionado ? ' selected' : ''}" onclick="toggleMenu(${i})">
        <div class="menu-top">
          <div class="menu-check">
            <span class="menu-check-icon">✓</span>
          </div>
          <div class="menu-info">
            <div class="menu-name">${m.nombre}</div>
            ${m.descripcion ? `<div class="menu-desc">${m.descripcion}</div>` : ''}
          </div>
          ${m.precio ? `<div class="menu-price">$${m.precio}</div>` : ''}
        </div>
        <div class="cantidad-row">
          <span class="cantidad-label">Cantidad</span>
          <div class="cantidad-ctrl">
            <button class="cant-btn" onclick="cambiarCantidad(event,${i},-1)">−</button>
            <span class="cant-num" id="cant-${i}">${seleccion[i].cantidad}</span>
            <button class="cant-btn" onclick="cambiarCantidad(event,${i},+1)">+</button>
          </div>
        </div>
      </div>
    `).join("")
}

function toggleMenu(i) {
  seleccion[i].seleccionado = !seleccion[i].seleccionado
  if (!seleccion[i].seleccionado) seleccion[i].cantidad = 1
  renderMenus()
  document.getElementById("err-menu").style.display = "none"
}

function cambiarCantidad(e, i, delta) {
  e.stopPropagation()
  const nueva = seleccion[i].cantidad + delta
  if (nueva < 1) return
  seleccion[i].cantidad = nueva
  document.getElementById("cant-" + i).textContent = nueva
}

/* ── Elección de entrega ── */
function elegirEntrega(tipo) {
  entregaSeleccionada = tipo
  document.getElementById("btn-delivery").classList.toggle("selected", tipo === "delivery")
  document.getElementById("btn-retiro").classList.toggle("selected", tipo === "retiro")
  document.getElementById("campo-direccion").classList.toggle("show", tipo === "delivery")
  document.getElementById("err-entrega").style.display = "none"
}

/* ── Envío del pedido ── */
function enviarPedido() {
  let ok = true

  const algunoSeleccionado = seleccion.some(s => s.seleccionado)
  if (!algunoSeleccionado) {
    document.getElementById("err-menu").style.display = "block"
    ok = false
  }

  if (!entregaSeleccionada) {
    document.getElementById("err-entrega").style.display = "block"
    ok = false
  }

  const nombre = document.getElementById("input-nombre").value.trim()
  if (!nombre) {
    document.getElementById("err-datos").style.display = "block"
    ok = false
  }

  const dir = document.getElementById("input-dir").value.trim()
  if (entregaSeleccionada === "delivery" && !dir) {
    document.getElementById("err-dir").style.display = "block"
    ok = false
  }

  if (!ok) return

  const horaConfirmacion = horaArgentina().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })

  const lineasPedido = seleccion
    .map((s, i) => s.seleccionado ? { menu: menusFirebase[i].nombre, cantidad: s.cantidad } : null)
    .filter(Boolean)

  const claveGuardado = fechaMenuActual
    ? claveFecha(fechaMenuActual)
    : claveFecha(horaArgentina())

  database.ref("pedidos/" + claveGuardado).push({
    menus: lineasPedido,
    entrega: entregaSeleccionada,
    direccion: dir || "-",
    nombre: nombre,
    hora: horaConfirmacion
  })

  const wa = "5493571636737"
  const itemsTexto = lineasPedido
    .map(l => `  • ${l.cantidad}x ${l.menu}`)
    .join("\n")

  let msg = `🍱 Nuevo pedido\n${itemsTexto}\nEntrega: ${entregaSeleccionada}\nNombre: ${nombre}`
  if (entregaSeleccionada === "delivery") msg += `\nDirección: ${dir}`

  window.open("https://wa.me/" + wa + "?text=" + encodeURIComponent(msg), "_blank")

  document.getElementById("main-form").style.display = "none"
  document.getElementById("success-screen").classList.add("show")
  document.getElementById("success-msg").innerText = "Gracias " + nombre
}

/* ── Inicio ── */
cargarMenus()