function activarDragNativo(wrapper, li, id) {
    const handle = li.querySelector('.drag-handle');
    let isDragging = false;
    let startY = 0;
    let initialTransform = 0;
    let placeholder = document.createElement('div');

    handle.addEventListener('touchstart', (e) => {
        e.stopPropagation(); 
        isDragging = true;
        startY = e.touches[0].clientY;
        
        // 1. Calculamos la posición exacta ANTES de mover nada
        const rect = wrapper.getBoundingClientRect();
        initialTransform = 0;

        // 2. Preparamos el efecto visual
        wrapper.style.zIndex = '1000';
        wrapper.style.position = 'relative';
        wrapper.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
        wrapper.style.transition = 'none';
        wrapper.style.background = '#f4f4f9';

        // 3. Creamos el espacio vacío y lo metemos en el DOM
        placeholder.style.height = `${wrapper.offsetHeight}px`;
        placeholder.style.marginTop = '4px';
        wrapper.parentNode.insertBefore(placeholder, wrapper);

        // 4. EL TRUCO: Movemos el wrapper a la posición absoluta de la pantalla temporalmente para que el dedo no lo pierda
        wrapper.style.position = 'fixed';
        wrapper.style.width = `${rect.width}px`;
        wrapper.style.top = `${rect.top}px`;
        wrapper.style.left = `${rect.left}px`;
    }, { passive: false });

    handle.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault(); 
        
        const clientY = e.touches[0].clientY;
        const deltaY = clientY - startY; 
        
        // Movemos el producto desde donde lo tomaste
        wrapper.style.transform = `translateY(${deltaY}px) scale(1.02)`;

        // Magia para reordenar visualmente
        const wrappers = [...listaCompras.querySelectorAll('.item-swipe-wrapper')];
        const currentIndex = wrappers.indexOf(wrapper);
        
        for (let i = 0; i < wrappers.length; i++) {
            if (i === currentIndex) continue;
            const other = wrappers[i];
            const otherRect = other.getBoundingClientRect();
            const otherMiddle = otherRect.top + otherRect.height / 2;
            
            if (clientY > otherMiddle && i > currentIndex) {
                listaCompras.insertBefore(wrapper, other.nextSibling);
                startY = clientY - deltaY + otherRect.height;
                break;
            } else if (clientY < otherMiddle && i < currentIndex) {
                listaCompras.insertBefore(wrapper, other);
                startY = clientY - deltaY - otherRect.height;
                break;
            }
        }
    }, { passive: false });

    handle.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        
        // Quitamos todos los estilos especiales y lo regresamos a su flujo normal
        wrapper.style.zIndex = '';
        wrapper.style.position = '';
        wrapper.style.boxShadow = '';
        wrapper.style.transform = '';
        wrapper.style.transition = 'transform 0.2s ease';
        wrapper.style.background = '';
        wrapper.style.width = '';
        wrapper.style.top = '';
        wrapper.style.left = '';

        if (placeholder.parentNode) {
            placeholder.parentNode.removeChild(placeholder);
        }

        // Guardamos el orden
        const items = listaCompras.querySelectorAll('.item-swipe-wrapper'); 
        const nuevoOrden = []; 
        const lista = getListaActual();
        items.forEach(item => { 
            const id = parseFloat(item.dataset.id); 
            const prod = lista.compraActual.find(p => p.id === id); 
            if (prod) nuevoOrden.push(prod); 
        });
        lista.compraActual = nuevoOrden; 
        guardarTodo();
    });
}
