// ============================================
//   MANDADITO - Lógica principal v2.4.3
//   Fix: Botón eliminar activo y arrastre libre
// ============================================

const DEPARTAMENTOS = [
    { nombre: "Abarrotes", emoji: "🥫" }, { nombre: "Carnes", emoji: "🥩" },
    { nombre: "Congelados", emoji: "❄️" }, { nombre: "Frutas y verduras", emoji: "🍓" },
    { nombre: "Higiene", emoji: "💅🏻" }, { nombre: "Hogar", emoji: "🧺" },
    { nombre: "Lácteos y embutidos", emoji: "🐮" }, { nombre: "Limpieza", emoji: "🧼" },
    { nombre: "Otros", emoji: "🧰" }, { nombre: "Panadería y tortillas", emoji: "🍞" },
    { nombre: "Prichos", emoji: "🛍️" }, { nombre: "Snacks", emoji: "🍫" }
];

function getEmoji(nombre) {
    const dep = DEPARTAMENTOS.find(d => d.nombre === nombre);
    return dep ? dep.emoji : "🧰";
}

let catalogoMaestro = JSON.parse(localStorage.getItem('mandadito_catalogo_maestro')) || [];
let listas = JSON.parse(localStorage.getItem('mandadito_listas')) || [];
let idListaActual = localStorage.getItem('mandadito_lista_actual') || null;
let categoriasContraidas = JSON.parse(localStorage.getItem('mandadito_categorias_contraidas')) || {};
let ultimoBorrado = null;

if (listas.length === 0) {
    const nuevaLista = { id: Date.now(), nombre: "Lista de Súper", compraActual: [], presupuesto: null };
    listas.push(nuevaLista);
    idListaActual = nuevaLista.id;
    guardarTodo();
}

listas.forEach(lista => {
    if (!lista.compraActual) lista.compraActual = [];
    if (typeof lista.presupuesto === 'undefined') lista.presupuesto = null;
});

if (!listas.find(l => l.id == idListaActual)) idListaActual = listas[0].id;

// DOM
const navCompra = document.getElementById('nav-compra'); const navProductos = document.getElementById('nav-productos'); const navCaptura = document.getElementById('nav-captura');
const screenCompra = document.getElementById('compra-screen'); const screenProductos = document.getElementById('productos-screen'); const screenCaptura = document.getElementById('captura-screen');
const btnAgregar = document.getElementById('btn-agregar'); const listaCompras = document.getElementById('lista-compras'); const mensajeVacio = document.getElementById('mensaje-vacio');
const totalCompra = document.getElementById('total-compra'); const footerCompra = document.getElementById('footer-compra'); const restanteContainer = document.getElementById('restante-container');
const restanteTexto = document.getElementById('restante-texto'); const restanteMonto = document.getElementById('restante-monto');
const btnBorrarSeleccionados = document.getElementById('btn-borrar-seleccionados'); const btnComprado = document.getElementById('btn-comprado');
const listaProductos = document.getElementById('lista-productos'); const mensajeProductosVacio = document.getElementById('mensaje-productos-vacio');
const btnAgregarACompra = document.getElementById('btn-agregar-a-compra'); const contadorSeleccionados = document.getElementById('contador-seleccionados');
const checkboxSeleccionarTodosProductos = document.getElementById('checkbox-seleccionar-todos-productos'); const textoSeleccionarTodosProductos = document.getElementById('texto-seleccionar-todos-productos');
const inputProducto = document.getElementById('producto'); const inputPrecio = document.getElementById('precio'); const inputCantidad = document.getElementById('cantidad'); const selectDepartamento = document.getElementById('departamento');
const selectorLista = document.getElementById('selector-lista'); const btnNuevaLista = document.getElementById('btn-nueva-lista'); const btnEditarLista = document.getElementById('btn-editar-lista'); const btnBorrarLista = document.getElementById('btn-borrar-lista');
const headerListaSelector = document.getElementById('header-lista-selector');
const toast = document.getElementById('toast'); const toastTexto = document.getElementById('toast-texto'); const toastUndo = document.getElementById('toast-undo');
const checkboxSeleccionarTodo = document.getElementById('checkbox-seleccionar-todo'); const textoSeleccionarTodo = document.getElementById('texto-seleccionar-todo'); const seleccionarTodoContainer = document.getElementById('seleccionar-todo-container');

const modalAgregar = document.getElementById('modal-agregar-compra'); const modalListasExistentes = document.getElementById('modal-listas-existentes'); const btnCrearNuevaListaModal = document.getElementById('btn-crear-nueva-lista-modal'); const btnCancelarModal = document.getElementById('btn-cancelar-modal'); const btnConfirmarModal = document.getElementById('btn-confirmar-modal');
const modalEditar = document.getElementById('modal-editar-producto'); const editarNombre = document.getElementById('editar-nombre'); const editarDepartamento = document.getElementById('editar-departamento'); const editarPrecio = document.getElementById('editar-precio'); const editarCantidad = document.getElementById('editar-cantidad'); const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion'); const btnGuardarEdicion = document.getElementById('btn-guardar-edicion');
const modalEditarLista = document.getElementById('modal-editar-lista'); const editarListaNombre = document.getElementById('editar-lista-nombre'); const editarListaPresupuesto = document.getElementById('editar-lista-presupuesto'); const btnCancelarEditarLista = document.getElementById('btn-cancelar-editar-lista'); const btnGuardarEditarLista = document.getElementById('btn-guardar-editar-lista');

let toastTimeout = null;
function mostrarToast(mensaje, tipo = 'exito', conUndo = false) {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTexto.textContent = mensaje;
    toast.className = 'toast visible';
    if (tipo === 'error') toast.classList.add('error');
    else if (tipo === 'alerta') toast.classList.add('alerta');
    else toast.classList.add('exito');
    toastUndo.style.display = conUndo ? 'inline-block' : 'none';
    toastTimeout = setTimeout(() => { toast.classList.remove('visible'); toastUndo.style.display = 'none'; }, conUndo ? 3000 : 1800);
}

toastUndo.addEventListener('click', () => {
    if (ultimoBorrado) {
        const lista = getListaActual();
        lista.compraActual.splice(ultimoBorrado.index, 0, ultimoBorrado.producto);
        guardarTodo(); renderizarListaCompra();
        mostrarToast('↩️ Producto restaurado', 'exito');
        ultimoBorrado = null; toast.classList.remove('visible');
    }
});

function init() {
    DEPARTAMENTOS.forEach(dep => {
        const option = document.createElement('option'); option.value = dep.nombre; option.textContent = `${dep.emoji} ${dep.nombre}`;
        selectDepartamento.appendChild(option); editarDepartamento.appendChild(option.cloneNode(true));
    });
    renderizarSelectorListas(); renderizarListaCompra();
}

function getListaActual() { return listas.find(l => l.id == idListaActual); }

navCompra.addEventListener('click', () => cambiarPantalla('compra'));
navProductos.addEventListener('click', () => cambiarPantalla('productos'));
navCaptura.addEventListener('click', () => cambiarPantalla('captura'));

function cambiarPantalla(pantalla) {
    screenCompra.classList.remove('active'); screenProductos.classList.remove('active'); screenCaptura.classList.remove('active');
    navCompra.classList.remove('active'); navProductos.classList.remove('active'); navCaptura.classList.remove('active');
    if (pantalla === 'compra') { screenCompra.classList.add('active'); navCompra.classList.add('active'); headerListaSelector.classList.remove('oculto'); renderizarListaCompra(); }
    else if (pantalla === 'productos') { screenProductos.classList.add('active'); navProductos.classList.add('active'); headerListaSelector.classList.add('oculto'); renderizarProductos(); }
    else if (pantalla === 'captura') { screenCaptura.classList.add('active'); navCaptura.classList.add('active'); headerListaSelector.classList.add('oculto'); }
}

btnAgregar.addEventListener('click', () => {
    const nombre = inputProducto.value.trim(); const departamento = selectDepartamento.value; const precio = parseFloat(inputPrecio.value); const cantidad = parseInt(inputCantidad.value) || 1;
    if (!nombre || isNaN(precio)) { mostrarToast('Ingresa nombre y precio válido', 'error'); return; }
    const existente = catalogoMaestro.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
    if (existente) { existente.precioAnterior = existente.precioUnitario; existente.precioUnitario = precio; existente.cantidad = cantidad; existente.departamento = departamento; }
    else { catalogoMaestro.push({ id: Date.now(), nombre: nombre, departamento: departamento, precioUnitario: precio, precioAnterior: null, cantidad: cantidad }); }
    guardarTodo(); inputProducto.value = ''; inputPrecio.value = ''; inputCantidad.value = '1'; inputProducto.focus();
    mostrarToast('✅ ' + nombre + ' agregado', 'exito');
});

function renderizarProductos() {
    listaProductos.innerHTML = '';
    if (catalogoMaestro.length === 0) { mensajeProductosVacio.style.display = 'block'; document.getElementById('seleccionar-todos-productos-container').style.display = 'none'; btnAgregarACompra.style.display = 'none'; return; }
    mensajeProductosVacio.style.display = 'none'; document.getElementById('seleccionar-todos-productos-container').style.display = 'flex';

    DEPARTAMENTOS.forEach(dep => {
        const productosDep = catalogoMaestro.filter(p => p.departamento === dep.nombre).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
        if (productosDep.length === 0) return;
        const contraida = categoriasContraidas[dep.nombre] === true;
        const header = document.createElement('li');
        header.className = 'categoria-header' + (contraida ? ' contraida' : '');
        header.dataset.departamento = dep.nombre;
        header.innerHTML = `<span class="emoji">${dep.emoji}</span><span>${dep.nombre}</span><span class="contador">${productosDep.length}</span><span class="flecha">▼</span>`;
        header.addEventListener('click', () => toggleCategoria(dep.nombre));
        listaProductos.appendChild(header);

        const subLista = document.createElement('ul');
        subLista.className = 'sub-lista-categoria' + (contraida ? ' contraida' : '');
        subLista.dataset.departamento = dep.nombre;

        productosDep.forEach(prod => {
            const li = document.createElement('li'); li.className = 'item-compra'; li.dataset.id = prod.id;
            const totalProducto = (prod.precioUnitario * prod.cantidad).toFixed(2);
            const textoAnterior = prod.precioAnterior ? `Compra anterior: $${prod.precioAnterior.toFixed(2)}` : 'Sin registro previo';
            li.innerHTML = `
                <div class="item-header">
                    <input type="checkbox" ${prod.seleccionado ? 'checked' : ''} onchange="toggleSeleccionado(${prod.id})">
                    <span class="drag-handle">⠿</span>
                    <span class="nombre">${prod.nombre}</span>
                    <div class="acciones"><button class="btn-editar" onclick="editarProducto(${prod.id})" title="Editar">✏️</button><button class="btn-eliminar" onclick="eliminarProducto(${prod.id})" title="Eliminar">🗑️</button></div>
                </div>
                <div class="item-detalles">
                    <div><label>Cant:</label><span style="font-size: 13px; font-weight: bold;">${prod.cantidad}</span></div>
                    <div><label>P.Unit:</label><span style="font-size: 13px; font-weight: bold;">$${prod.precioUnitario.toFixed(2)}</span></div>
                    <div class="item-total">Total: $${totalProducto}</div>
                </div>
                <div class="precio-anterior">${textoAnterior}</div>`;
            subLista.appendChild(li);
        });
        listaProductos.appendChild(subLista);
        activarDragAndDropCategoria(subLista, dep.nombre);
    });
    actualizarBotonAgregarACompra(); actualizarCheckboxSeleccionarTodos();
}

function toggleCategoria(nombreCategoria) {
    categoriasContraidas[nombreCategoria] = !categoriasContraidas[nombreCategoria];
    const header = listaProductos.querySelector(`.categoria-header[data-departamento="${nombreCategoria}"]`);
    const subLista = listaProductos.querySelector(`.sub-lista-categoria[data-departamento="${nombreCategoria}"]`);
    if (header && subLista) {
        if (categoriasContraidas[nombreCategoria]) { header.classList.add('contraida'); subLista.classList.add('contraida'); }
        else { header.classList.remove('contraida'); subLista.classList.remove('contraida'); }
    }
    localStorage.setItem('mandadito_categorias_contraidas', JSON.stringify(categoriasContraidas));
}

function renderizarListaCompra() {
    const lista = getListaActual(); if (!lista) return;
    listaCompras.innerHTML = '';
    if (lista.compraActual.length === 0) {
        seleccionarTodoContainer.style.display = 'none'; mensajeVacio.style.display = 'block'; totalCompra.textContent = '$0.00'; actualizarPresupuestoUI(); return;
    }
    seleccionarTodoContainer.style.display = 'flex'; mensajeVacio.style.display = 'none';

    lista.compraActual.forEach(prod => {
        const wrapper = document.createElement('div'); wrapper.className = 'item-swipe-wrapper'; wrapper.dataset.id = prod.id;
        
        const btnDeleteBg = document.createElement('div'); 
        btnDeleteBg.className = 'swipe-bg-delete';
        // El fondo rojo SÍ es un botón funcional
        btnDeleteBg.onclick = () => {
            const li = wrapper.querySelector('.item-compra');
            if (li.style.transform && li.style.transform.includes('-100%')) {
                borrarProductoCompra(prod.id);
            }
        };
        wrapper.appendChild(btnDeleteBg);

        const li = document.createElement('li'); li.className = 'item-compra' + (prod.comprado ? ' comprado' : ''); li.dataset.id = prod.id;
        const totalProducto = (prod.precioUnitario * prod.cantidad).toFixed(2);
        const textoAnterior = prod.precioAnterior ? `Compra anterior: $${prod.precioAnterior.toFixed(2)}` : 'Sin registro previo';

        li.innerHTML = `
            <div class="item-header">
                <input type="checkbox" ${prod.comprado ? 'checked' : ''} onchange="toggleComprado(${prod.id})">
                <span class="nombre">${getEmoji(prod.departamento)} ${prod.nombre}</span>
            </div>
            <div class="item-detalles">
                <div><label>Cant:</label><input type="number" value="${prod.cantidad}" min="1" onblur="actualizarCantidad(${prod.id}, this.value)"></div>
                <div><label>P.Unit:</label><input type="number" value="${prod.precioUnitario}" step="0.01" onblur="actualizarPrecio(${prod.id}, this.value)"></div>
                <div class="item-total">Total: $${totalProducto}</div>
                <span class="drag-handle">⠿</span>
            </div>
            <div class="precio-anterior">${textoAnterior}</div>`;
        wrapper.appendChild(li); listaCompras.appendChild(wrapper);
        activarSwipe(wrapper, li, prod.id);
    });
    calcularTotal(); actualizarCheckboxSeleccionarTodo(); activarDragAndDropWrapper(); actualizarPresupuestoUI();
}

function activarSwipe(wrapper, li, id) {
    let startX = 0, startY = 0, currentX = 0, isDragging = false, isHorizontal = null;
    const UMBRAL = 80;

    li.addEventListener('touchstart', (e) => {
        // AQUÍ ESTÁ EL FIX: Se quitó .drag-handle para que deje arrastrar
        if (e.target.closest('input, button')) return;
        startX = e.touches[0].clientX; startY = e.touches[0].clientY; currentX = 0; isDragging = true; isHorizontal = null; li.style.transition = 'none';
    }, { passive: true });

    li.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const deltaX = e.touches[0].clientX - startX; const deltaY = e.touches[0].clientY - startY;
        if (isHorizontal === null) {
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 5) isHorizontal = true;
            else if (Math.abs(deltaY) > 5) { isHorizontal = false; isDragging = false; return; }
        }
        if (isHorizontal) { currentX = Math.min(0, deltaX); li.style.transform = `translateX(${currentX}px)`; }
    }, { passive: true });

    li.addEventListener('touchend', () => {
        if (!isDragging) return; isDragging = false; li.style.transition = 'transform 0.25s ease';
        if (currentX < -UMBRAL) { li.style.transform = `translateX(-100%)`; } 
        else { li.style.transform = 'translateX(0)'; }
        currentX = 0;
    });

    // Soporte para mouse (PC)
    li.addEventListener('mousedown', (e) => {
        // AQUÍ TAMBIÉN SE QUITÓ .drag-handle
        if (e.target.closest('input, button')) return;
        startX = e.clientX; isDragging = true; isHorizontal = null; li.style.transition = 'none';
        const onMouseMove = (ev) => {
            if (!isDragging) return; const deltaX = ev.clientX - startX;
            if (isHorizontal === null) { if (Math.abs(deltaX) > 5) isHorizontal = true; }
            if (isHorizontal) { currentX = Math.min(0, deltaX); li.style.transform = `translateX(${currentX}px)`; }
        };
        const onMouseUp = () => {
            if (!isDragging) return; isDragging = false; document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); li.style.transition = 'transform 0.25s ease';
            if (currentX < -UMBRAL) { li.style.transform = `translateX(-100%)`; } else { li.style.transform = 'translateX(0)'; }
            currentX = 0;
        };
        document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp);
    });
}

function borrarProductoCompra(id) {
    const lista = getListaActual(); const index = lista.compraActual.findIndex(p => p.id === id); if (index === -1) return;
    const producto = lista.compraActual[index];
    ultimoBorrado = { producto: { ...producto }, index: index };
    lista.compraActual.splice(index, 1); guardarTodo(); renderizarListaCompra();
    mostrarToast(`🗑️ "${producto.nombre}" borrado`, 'exito', true);
}

function actualizarPresupuestoUI() {
    const lista = getListaActual(); if (!lista) return; renderizarSelectorListas();
    if (lista.presupuesto && lista.presupuesto > 0) {
        restanteContainer.style.display = 'flex'; let totalPalomeado = 0;
        lista.compraActual.forEach(prod => { if (prod.comprado) totalPalomeado += prod.precioUnitario * prod.cantidad; });
        const restante = lista.presupuesto - totalPalomeado;
        if (restante < 0) { footerCompra.classList.add('sobrepasado'); restanteTexto.textContent = '🚨 Restante:'; restanteMonto.textContent = '-$' + Math.abs(restante).toFixed(2); }
        else { footerCompra.classList.remove('sobrepasado'); restanteTexto.textContent = '💰 Restante:'; restanteMonto.textContent = '$' + restante.toFixed(2); }
    } else { restanteContainer.style.display = 'none'; footerCompra.classList.remove('sobrepasado'); }
}

window.toggleSeleccionado = function(id) { const prod = catalogoMaestro.find(p => p.id === id); if (prod) { prod.seleccionado = !prod.seleccionado; guardarTodo(); renderizarProductos(); } };
window.editarProducto = function(id) { const prod = catalogoMaestro.find(p => p.id === id); if (!prod) return; editarNombre.value = prod.nombre; editarDepartamento.value = prod.departamento; editarPrecio.value = prod.precioUnitario; editarCantidad.value = prod.cantidad; modalEditar.dataset.editandoId = id; modalEditar.classList.add('visible'); };
window.eliminarProducto = function(id) { const prod = catalogoMaestro.find(p => p.id === id); if (!prod) return; if (confirm(`¿Eliminar "${prod.nombre}" del catálogo?`)) { catalogoMaestro = catalogoMaestro.filter(p => p.id !== id); guardarTodo(); renderizarProductos(); mostrarToast('✅ Producto eliminado', 'exito'); } };

btnGuardarEdicion.addEventListener('click', () => { const id = parseInt(modalEditar.dataset.editandoId); const prod = catalogoMaestro.find(p => p.id === id); if (!prod) return; prod.nombre = editarNombre.value.trim() || prod.nombre; prod.departamento = editarDepartamento.value; prod.precioUnitario = parseFloat(editarPrecio.value) || prod.precioUnitario; prod.cantidad = parseInt(editarCantidad.value) || 1; guardarTodo(); renderizarProductos(); modalEditar.classList.remove('visible'); mostrarToast('✅ Producto actualizado', 'exito'); });
btnCancelarEdicion.addEventListener('click', () => { modalEditar.classList.remove('visible'); });

window.toggleComprado = function(id) {
    const lista = getListaActual(); const prod = lista.compraActual.find(p => p.id === id);
    if (prod) {
        prod.comprado = !prod.comprado;
        lista.compraActual.sort((a, b) => a.comprado - b.comprado);
        guardarTodo(); renderizarListaCompra();
    }
};

window.actualizarCantidad = function(id, nuevaCantidad) { const lista = getListaActual(); const prod = lista.compraActual.find(p => p.id === id); if (prod) { const cant = parseInt(nuevaCantidad) || 1; if (cant !== prod.cantidad) { prod.cantidad = cant; guardarTodo(); renderizarListaCompra(); } } };
window.actualizarPrecio = function(id, nuevoPrecio) { const lista = getListaActual(); const prod = lista.compraActual.find(p => p.id === id); if (prod) { const precio = parseFloat(nuevoPrecio) || 0; if (precio !== prod.precioUnitario) { prod.precioAnterior = prod.precioUnitario; prod.precioUnitario = precio; guardarTodo(); renderizarListaCompra(); } } };

function actualizarBotonAgregarACompra() { const seleccionados = catalogoMaestro.filter(p => p.seleccionado).length; contadorSeleccionados.textContent = seleccionados; btnAgregarACompra.style.display = seleccionados > 0 ? 'block' : 'none'; }

btnAgregarACompra.addEventListener('click', () => {
    const seleccionados = catalogoMaestro.filter(p => p.seleccionado); if (seleccionados.length === 0) return;
    modalListasExistentes.innerHTML = '';
    listas.forEach(lista => {
        const div = document.createElement('div'); div.className = 'modal-lista-opcion';
        div.innerHTML = `<input type="radio" name="lista-destino" value="${lista.id}" id="lista-${lista.id}"><label for="lista-${lista.id}">${lista.nombre}</label>`;
        div.addEventListener('click', () => { document.querySelectorAll('.modal-lista-opcion').forEach(d => d.classList.remove('seleccionada')); div.classList.add('seleccionada'); div.querySelector('input').checked = true; });
        modalListasExistentes.appendChild(div);
    });
    modalAgregar.classList.add('visible');
});

btnCrearNuevaListaModal.addEventListener('click', () => { const nombre = prompt('Nombre de la nueva lista:', 'Nueva Lista'); if (!nombre) return; const nuevaLista = { id: Date.now(), nombre: nombre, compraActual: [], presupuesto: null }; listas.push(nuevaLista); idListaActual = nuevaLista.id; guardarTodo(); renderizarSelectorListas(); mostrarToast('✅ Lista creada', 'exito'); btnAgregarACompra.click(); });
btnCancelarModal.addEventListener('click', () => { modalAgregar.classList.remove('visible'); });
btnConfirmarModal.addEventListener('click', () => {
    const radioSeleccionado = document.querySelector('input[name="lista-destino"]:checked'); if (!radioSeleccionado) { mostrarToast('Selecciona una lista', 'error'); return; }
    const idDestino = parseInt(radioSeleccionado.value); const listaDestino = listas.find(l => l.id === idDestino); if (!listaDestino) return;
    const seleccionados = catalogoMaestro.filter(p => p.seleccionado); let agregados = 0, duplicados = 0;
    seleccionados.forEach(prodCat => {
        const existe = listaDestino.compraActual.find(p => p.nombre.toLowerCase() === prodCat.nombre.toLowerCase());
        if (existe) duplicados++;
        else { listaDestino.compraActual.push({ id: Date.now() + Math.random(), nombre: prodCat.nombre, departamento: prodCat.departamento, precioUnitario: prodCat.precioUnitario, precioAnterior: prodCat.precioAnterior, cantidad: prodCat.cantidad, comprado: false }); agregados++; }
        prodCat.seleccionado = false;
    });
    guardarTodo(); renderizarProductos(); modalAgregar.classList.remove('visible');
    mostrarToast(duplicados > 0 ? `✅ ${agregados} agregados. ⚠️ ${duplicados} ya existían.` : `✅ ${agregados} agregados.`, 'exito');
});

checkboxSeleccionarTodosProductos.addEventListener('change', (e) => { const marcar = e.target.checked; catalogoMaestro.forEach(p => p.seleccionado = marcar); guardarTodo(); renderizarProductos(); });
function actualizarCheckboxSeleccionarTodos() {
    if (catalogoMaestro.length === 0) return;
    const total = catalogoMaestro.length; const sel = catalogoMaestro.filter(p => p.seleccionado).length;
    checkboxSeleccionarTodosProductos.checked = sel === total; checkboxSeleccionarTodosProductos.indeterminate = sel > 0 && sel < total;
    textoSeleccionarTodosProductos.textContent = sel === 0 ? `Seleccionar todos (${total})` : (sel === total ? `Todos seleccionados (${total})` : `Seleccionados ${sel} de ${total}`);
}

function calcularTotal() { const lista = getListaActual(); let total = 0; lista.compraActual.forEach(prod => { if (prod.comprado) total += prod.precioUnitario * prod.cantidad; }); totalCompra.textContent = '$' + total.toFixed(2); }
function actualizarCheckboxSeleccionarTodo() {
    const lista = getListaActual(); if (!lista || lista.compraActual.length === 0) return;
    const total = lista.compraActual.length; const sel = lista.compraActual.filter(p => p.comprado).length;
    checkboxSeleccionarTodo.checked = sel === total; checkboxSeleccionarTodo.indeterminate = sel > 0 && sel < total;
    textoSeleccionarTodo.textContent = sel === 0 ? `Seleccionar todo (${total})` : (sel === total ? `Todos seleccionados (${total})` : `Seleccionados ${sel} de ${total}`);
}

checkboxSeleccionarTodo.addEventListener('change', (e) => {
    const lista = getListaActual(); if (!lista) return; const marcar = e.target.checked;
    lista.compraActual.forEach(p => p.comprado = marcar);
    lista.compraActual.sort((a, b) => a.comprado - b.comprado);
    guardarTodo(); renderizarListaCompra();
});

btnBorrarSeleccionados.addEventListener('click', () => { const lista = getListaActual(); const seleccionados = lista.compraActual.filter(p => p.comprado); if (seleccionados.length === 0) { mostrarToast('No has palomeado nada', 'error'); return; } if (confirm(`¿Borrar ${seleccionados.length} producto(s)?`)) { lista.compraActual = lista.compraActual.filter(p => !p.comprado); guardarTodo(); renderizarListaCompra(); mostrarToast('✅ Borrado(s)', 'exito'); } });
btnComprado.addEventListener('click', () => { const lista = getListaActual(); if (lista.compraActual.length === 0) { mostrarToast('Lista vacía', 'error'); return; } if (confirm(`¿Terminaste tu compra?`)) { lista.compraActual = []; guardarTodo(); renderizarListaCompra(); mostrarToast('✅ ¡Compra finalizada!', 'exito'); } });

function renderizarSelectorListas() { selectorLista.innerHTML = ''; listas.forEach(lista => { const option = document.createElement('option'); option.value = lista.id; option.textContent = lista.presupuesto > 0 ? `${lista.nombre} 💰 $${lista.presupuesto.toFixed(2)}` : lista.nombre; if (lista.id == idListaActual) option.selected = true; selectorLista.appendChild(option); }); }
selectorLista.addEventListener('change', (e) => { idListaActual = e.target.value; guardarTodo(); renderizarListaCompra(); });
btnNuevaLista.addEventListener('click', () => { const nombre = prompt('Nombre:', 'Nueva Lista'); if (!nombre) return; const nuevaLista = { id: Date.now(), nombre: nombre, compraActual: [], presupuesto: null }; listas.push(nuevaLista); idListaActual = nuevaLista.id; guardarTodo(); renderizarSelectorListas(); renderizarListaCompra(); mostrarToast('✅ Lista creada', 'exito'); });
btnEditarLista.addEventListener('click', () => { const lista = getListaActual(); if (!lista) return; editarListaNombre.value = lista.nombre; editarListaPresupuesto.value = lista.presupuesto || ''; modalEditarLista.classList.add('visible'); });
btnCancelarEditarLista.addEventListener('click', () => { modalEditarLista.classList.remove('visible'); });
btnGuardarEditarLista.addEventListener('click', () => {
    const lista = getListaActual(); if (!lista) return;
    const nuevoNombre = editarListaNombre.value.trim(); if (nuevoNombre) lista.nombre = nuevoNombre;
    const nuevoPresupuesto = parseFloat(editarListaPresupuesto.value); lista.presupuesto = (!isNaN(nuevoPresupuesto) && nuevoPresupuesto > 0) ? nuevoPresupuesto : null;
    guardarTodo(); renderizarSelectorListas(); renderizarListaCompra(); modalEditarLista.classList.remove('visible'); mostrarToast('✅ Lista actualizada', 'exito');
});
btnBorrarLista.addEventListener('click', () => { if (listas.length === 1) { mostrarToast('No puedes borrar la única lista', 'error'); return; } const lista = getListaActual(); if (confirm(`¿Borrar "${lista.nombre}"?`)) { listas = listas.filter(l => l.id != idListaActual); idListaActual = listas[0].id; guardarTodo(); renderizarSelectorListas(); renderizarListaCompra(); mostrarToast('✅ Lista borrada', 'exito'); } });

function guardarTodo() { localStorage.setItem('mandadito_catalogo_maestro', JSON.stringify(catalogoMaestro)); localStorage.setItem('mandadito_listas', JSON.stringify(listas)); localStorage.setItem('mandadito_lista_actual', idListaActual); }

function activarDragAndDropWrapper() {
    const listaUL = document.getElementById('lista-compras'); if (!listaUL) return; if (listaUL._sortableInstance) listaUL._sortableInstance.destroy();
    listaUL._sortableInstance = new Sortable(listaUL, {
        animation: 150, handle: '.drag-handle', ghostClass: 'arrastrando',
        onEnd: function() {
            const items = listaUL.querySelectorAll('.item-swipe-wrapper'); const nuevoOrden = []; const lista = getListaActual();
            items.forEach(item => { const id = parseFloat(item.dataset.id); const prod = lista.compraActual.find(p => p.id === id); if (prod) nuevoOrden.push(prod); });
            lista.compraActual = nuevoOrden; guardarTodo();
        }
    });
}

function activarDragAndDropCategoria(subLista, departamento) {
    if (subLista._sortableInstance) subLista._sortableInstance.destroy();
    subLista._sortableInstance = new Sortable(subLista, {
        animation: 150, handle: '.drag-handle', ghostClass: 'arrastrando',
        onEnd: function() {
            const items = subLista.querySelectorAll('.item-compra'); const idsCategoria = []; items.forEach(item => idsCategoria.push(parseFloat(item.dataset.id)));
            const otrosProductos = catalogoMaestro.filter(p => p.departamento !== departamento); const productosCategoria = idsCategoria.map(id => catalogoMaestro.find(p => p.id === id)).filter(Boolean);
            const nuevoCatalogo = []; DEPARTAMENTOS.forEach(dep => { if (dep.nombre === departamento) nuevoCatalogo.push(...productosCategoria); else nuevoCatalogo.push(...otrosProductos.filter(p => p.departamento === dep.nombre)); });
            catalogoMaestro = nuevoCatalogo; guardarTodo();
        }
    });
}

init();
