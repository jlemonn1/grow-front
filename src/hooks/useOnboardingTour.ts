import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '@/context/config.context';
import { useDemo } from '@/context/demo.context';
import { useProducts } from '@/context/products.context';
import { useCustomers } from '@/context/customers.context';
import { cleanupTestData } from '@/services/testData.service';

export interface TourStep {
  id: string;
  route: string;
  selector: string; // Selector CSS o data-tour del elemento a resaltar
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  waitForElement?: boolean; // Si debe esperar a que el elemento exista
  delay?: number; // Delay antes de mostrar el paso (ms)
  autoAdvance?: boolean; // Si debe avanzar automáticamente sin necesidad de hacer clic
  autoAdvanceDelay?: number; // Delay antes de avanzar automáticamente (ms)
  // Acciones automáticas del autopilot
  autoAction?: {
    type: 'click' | 'type' | 'select' | 'wait' | 'set-image';
    value?: string; // Texto a escribir o valor a seleccionar
    delayAfter?: number; // Delay después de la acción (ms)
  };
}

// Fase 1: Tour de ventas (caja)
export const TOUR_STEPS_PHASE1: TourStep[] = [
  // === PÁGINA DE CAJA (/sales/new) - PASOS SIMPLIFICADOS ===
  {
    id: 'sales-new-title',
    route: '/sales/new',
    selector: '[data-tour="page-header-title"]',
    title: 'Página de Dispensar',
    description: 'Aquí puedes realizar ventas: seleccionar clientes, agregar productos y procesar la transacción.',
    position: 'bottom',
    waitForElement: true,
    delay: 500,
    autoAdvance: true,
    autoAdvanceDelay: 2000,
  },
  {
    id: 'sales-new-customer-search',
    route: '/sales/new',
    selector: '[data-tour="customer-search-input"]',
    title: 'Buscar Cliente',
    description: 'Busca por nombre, teléfono o PIN. El sistema detecta automáticamente el tipo de búsqueda.',
    position: 'bottom',
    waitForElement: true,
    delay: 300,
    autoAdvance: true,
    autoAdvanceDelay: 800, // Avanzar después del click (300ms delayAfter + margen)
    autoAction: {
      type: 'click',
      delayAfter: 300,
    },
  },
  {
    id: 'sales-new-customer-type',
    route: '/sales/new',
    selector: '[data-tour="customer-search-input"]',
    title: 'Buscando Cliente',
    description: 'Escribiendo el nombre del cliente...',
    position: 'bottom',
    waitForElement: true,
    delay: 200,
    autoAdvance: true,
    autoAdvanceDelay: 2500, // Esperar a que la búsqueda se complete (debounce 300ms + API call + margen)
    autoAction: {
      type: 'type',
      value: 'Juan',
      delayAfter: 2000,
    },
  },
  {
    id: 'sales-new-customer-select',
    route: '/sales/new',
    selector: '[data-tour^="customer-row-"]',
    title: 'Cliente Seleccionado',
    description: 'Seleccionando el primer cliente de los resultados.',
    position: 'bottom',
    waitForElement: true,
    delay: 500,
    autoAdvance: true,
    autoAdvanceDelay: 1500,
    autoAction: {
      type: 'select',
      value: 'first',
      delayAfter: 500,
    },
  },
  {
    id: 'sales-new-product-search',
    route: '/sales/new',
    selector: '[data-tour="product-search-input"]',
    title: 'Buscar Producto',
    description: 'Busca productos por nombre. Verás stock disponible y precio por gramo.',
    position: 'bottom',
    waitForElement: true,
    delay: 300,
    autoAction: {
      type: 'click',
      delayAfter: 500,
    },
  },
  {
    id: 'sales-new-product-type',
    route: '/sales/new',
    selector: '[data-tour="product-search-input"]',
    title: 'Buscando Producto',
    description: 'Buscando producto...',
    position: 'bottom',
    waitForElement: true,
    delay: 200,
    autoAdvance: true,
    autoAdvanceDelay: 1500,
    autoAction: {
      type: 'type',
      value: 'Premium',
      delayAfter: 1000,
    },
  },
  {
    id: 'sales-new-product-select',
    route: '/sales/new',
    selector: '[data-tour^="product-row-"]',
    title: 'Producto Seleccionado',
    description: 'Selecciona el producto de la lista.',
    position: 'bottom',
    waitForElement: true,
    delay: 500,
    autoAdvance: true,
    autoAdvanceDelay: 1500,
    autoAction: {
      type: 'click',
      delayAfter: 800,
    },
  },
  {
    id: 'sales-new-grams-input',
    route: '/sales/new',
    selector: '[data-tour="grams-input"]',
    title: 'Especificar Gramos',
    description: 'Indica los gramos a dispensar. Puedes usar botones rápidos o escribir manualmente.',
    position: 'bottom',
    waitForElement: true,
    delay: 300,
    autoAction: {
      type: 'click',
      delayAfter: 500,
    },
  },
  {
    id: 'sales-new-grams-type',
    route: '/sales/new',
    selector: '[data-tour="grams-input"]',
    title: 'Gramos Especificados',
    description: 'Escribiendo gramos...',
    position: 'bottom',
    waitForElement: true,
    delay: 200,
    autoAdvance: true,
    autoAdvanceDelay: 1500,
    autoAction: {
      type: 'type',
      value: '1.5',
      delayAfter: 800,
    },
  },
  {
    id: 'sales-new-add-product',
    route: '/sales/new',
    selector: '[data-tour="add-product"]',
    title: 'Agregar al Ticket',
    description: 'Agrega el producto al ticket. El sistema valida el stock automáticamente.',
    position: 'bottom',
    waitForElement: true,
    delay: 300,
    autoAdvance: true,
    autoAdvanceDelay: 1500,
    autoAction: {
      type: 'click',
      delayAfter: 1000,
    },
  },
  {
    id: 'sales-new-summary-section',
    route: '/sales/new',
    selector: '.ticket-summary',
    title: 'Resumen del Ticket',
    description: 'Aquí verás el resumen: cliente, productos, total y cambio calculado automáticamente.',
    position: 'left',
    waitForElement: true,
    delay: 500,
    autoAdvance: true,
    autoAdvanceDelay: 2000,
  },
  {
    id: 'sales-new-cash-input',
    route: '/sales/new',
    selector: '[data-tour="cash-given-input"]',
    title: 'Efectivo Recibido',
    description: 'Indica el efectivo recibido. Puedes usar botones rápidos o escribir manualmente.',
    position: 'top',
    waitForElement: true,
    delay: 300,
    autoAction: {
      type: 'click',
      delayAfter: 500,
    },
  },
  {
    id: 'sales-new-cash-type',
    route: '/sales/new',
    selector: '[data-tour="cash-given-input"]',
    title: 'Efectivo Ingresado',
    description: 'Escribiendo efectivo...',
    position: 'top',
    waitForElement: true,
    delay: 200,
    autoAdvance: true,
    autoAdvanceDelay: 1500,
    autoAction: {
      type: 'type',
      value: '50',
      delayAfter: 800,
    },
  },
  {
    id: 'sales-new-confirm',
    route: '/sales/new',
    selector: '[data-tour="confirm-sale"]',
    title: 'Confirmar Venta',
    description: 'Cuando todo esté correcto, haz clic en "Procesar Venta" para completar la transacción.',
    position: 'top',
    waitForElement: true,
    delay: 500,
  },
  // === PASO DE TRANSICIÓN (cambia de página) ===
  {
    id: 'transition-to-products',
    route: '/sales/new', // Mantener en sales/new hasta que se ejecute la navegación
    selector: '[data-tour="page-header-title"]',
    title: 'Cambiando a Productos',
    description: 'Ahora vamos a aprender a crear productos. Haz clic en "Cargar página" para continuar.',
    position: 'bottom',
    waitForElement: false, // No esperar elemento, solo cambiar página
    delay: 100,
    autoAdvance: false, // Desactivado para que el usuario haga clic en "Cargar página"
    autoAdvanceDelay: 1000,
  },
  // === PÁGINA DE PRODUCTOS (/products/new) - FASE 2 ===
  {
    id: 'product-new-title',
    route: '/products/new',
    selector: '[data-tour="page-header-title"]',
    title: 'Página de Productos',
    description: 'Aquí puedes crear y gestionar productos: definir nombre, categoría, precio, stock e imagen.',
    position: 'bottom',
    waitForElement: true,
    delay: 500,
    autoAdvance: true,
    autoAdvanceDelay: 2000,
  },
  {
    id: 'product-new-name-click',
    route: '/products/new',
    selector: '[data-tour="product-name-input"]',
    title: 'Nombre del Producto',
    description: 'Escribe el nombre del producto. Este será el identificador principal.',
    position: 'bottom',
    waitForElement: true,
    delay: 300,
    autoAction: {
      type: 'click',
      delayAfter: 500,
    },
  },
  {
    id: 'product-new-name-type',
    route: '/products/new',
    selector: '[data-tour="product-name-input"]',
    title: 'Escribiendo Nombre',
    description: 'Escribiendo nombre del producto...',
    position: 'bottom',
    waitForElement: true,
    delay: 200,
    autoAdvance: true,
    autoAdvanceDelay: 1500,
    autoAction: {
      type: 'type',
      value: 'Producto Demo Tour',
      delayAfter: 800,
    },
  },
  {
    id: 'product-new-category-select',
    route: '/products/new',
    selector: '[data-tour="product-category-select"]',
    title: 'Seleccionar Categoría',
    description: 'Selecciona la categoría del producto. Las categorías ayudan a organizar tu inventario.',
    position: 'bottom',
    waitForElement: true,
    delay: 500,
    autoAdvance: true,
    autoAdvanceDelay: 2000,
    autoAction: {
      type: 'select',
      value: 'first-option',
      delayAfter: 500,
    },
  },
  {
    id: 'product-new-price-click',
    route: '/products/new',
    selector: '[data-tour="product-price-input"]',
    title: 'Precio por Gramo',
    description: 'Establece el precio por gramo. Este será el precio base de venta.',
    position: 'bottom',
    waitForElement: true,
    delay: 300,
    autoAction: {
      type: 'click',
      delayAfter: 500,
    },
  },
  {
    id: 'product-new-price-type',
    route: '/products/new',
    selector: '[data-tour="product-price-input"]',
    title: 'Escribiendo Precio',
    description: 'Escribiendo precio...',
    position: 'bottom',
    waitForElement: true,
    delay: 200,
    autoAdvance: true,
    autoAdvanceDelay: 1500,
    autoAction: {
      type: 'type',
      value: '10.50',
      delayAfter: 800,
    },
  },
  {
    id: 'product-new-stock-click',
    route: '/products/new',
    selector: '[data-tour="product-stock-input"]',
    title: 'Stock Inicial',
    description: 'Define el stock inicial en gramos. El sistema rastreará los movimientos automáticamente.',
    position: 'bottom',
    waitForElement: true,
    delay: 300,
    autoAction: {
      type: 'click',
      delayAfter: 500,
    },
  },
  {
    id: 'product-new-stock-type',
    route: '/products/new',
    selector: '[data-tour="product-stock-input"]',
    title: 'Escribiendo Stock',
    description: 'Escribiendo stock inicial...',
    position: 'bottom',
    waitForElement: true,
    delay: 200,
    autoAdvance: true,
    autoAdvanceDelay: 1500,
    autoAction: {
      type: 'type',
      value: '100',
      delayAfter: 800,
    },
  },
  {
    id: 'product-new-image',
    route: '/products/new',
    selector: '[data-tour="product-image-upload"]',
    title: 'Imagen del Producto',
    description: 'Sube una imagen para identificar el producto. Puedes usar la galería o la cámara. Para el tour, se establecerá automáticamente una imagen de ejemplo.',
    position: 'bottom',
    waitForElement: true,
    delay: 500,
    autoAdvance: true,
    autoAdvanceDelay: 2500,
    autoAction: {
      type: 'set-image',
      value: 'https://via.placeholder.com/300x300?text=Producto+Demo+Tour',
      delayAfter: 800,
    },
  },
  {
    id: 'product-new-description-click',
    route: '/products/new',
    selector: '[data-tour="product-description-textarea"]',
    title: 'Descripción',
    description: 'Añade una descripción opcional con información adicional sobre el producto.',
    position: 'bottom',
    waitForElement: true,
    delay: 300,
    autoAction: {
      type: 'click',
      delayAfter: 500,
    },
  },
  {
    id: 'product-new-description-type',
    route: '/products/new',
    selector: '[data-tour="product-description-textarea"]',
    title: 'Escribiendo Descripción',
    description: 'Escribiendo descripción...',
    position: 'bottom',
    waitForElement: true,
    delay: 200,
    autoAdvance: true,
    autoAdvanceDelay: 1500,
    autoAction: {
      type: 'type',
      value: 'Producto creado durante el tour de onboarding',
      delayAfter: 800,
    },
  },
  {
    id: 'product-new-save',
    route: '/products/new',
    selector: '[data-tour="save-product"]',
    title: 'Guardar Producto',
    description: 'Cuando todos los campos estén completos, haz clic en "Guardar producto" para crear el producto en el sistema.',
    position: 'top',
    waitForElement: true,
    delay: 500,
  },
  // === TRANSICIÓN A LISTA DE PRODUCTOS ===
  {
    id: 'transition-to-products-list',
    route: '/products/new', // Mantener hasta que se navegue
    selector: '[data-tour="page-header-title"]',
    title: 'Cambiando a Lista de Productos',
    description: 'Ahora vamos a ver cómo buscar y gestionar productos existentes. Haz clic en "Cargar página" para continuar.',
    position: 'bottom',
    waitForElement: false,
    delay: 100,
    autoAdvance: false, // Requiere confirmación manual del usuario
    autoAdvanceDelay: 1000,
  },
  // === PÁGINA DE LISTA DE PRODUCTOS (/products) ===
  {
    id: 'products-list-title',
    route: '/products',
    selector: '[data-tour="products-list"]',
    title: 'Lista de Productos',
    description: 'Aquí puedes ver todos tus productos, buscar por nombre y gestionarlos.',
    position: 'bottom',
    waitForElement: true,
    delay: 500,
    autoAdvance: true,
    autoAdvanceDelay: 2000,
  },
  {
    id: 'products-list-search-click',
    route: '/products',
    selector: '[data-tour="product-search"]',
    title: 'Buscar Producto',
    description: 'Usa el campo de búsqueda para encontrar productos por nombre.',
    position: 'bottom',
    waitForElement: true,
    delay: 300,
    autoAction: {
      type: 'click',
      delayAfter: 500,
    },
  },
  {
    id: 'products-list-search-type',
    route: '/products',
    selector: '[data-tour="product-search"]',
    title: 'Buscando Producto',
    description: 'Escribiendo "Premium" para buscar productos...',
    position: 'bottom',
    waitForElement: true,
    delay: 200,
    autoAdvance: true,
    autoAdvanceDelay: 2000, // Esperar debounce (300ms) + API call + margen
    autoAction: {
      type: 'type',
      value: 'Premium',
      delayAfter: 1500,
    },
  },
  {
    id: 'products-list-select-first',
    route: '/products',
    selector: '[data-tour^="product-row-"]',
    title: 'Seleccionar Producto',
    description: 'Haz clic en el primer producto de los resultados para ver sus detalles.',
    position: 'bottom',
    waitForElement: true,
    delay: 500,
    autoAdvance: false, // No avanzar automáticamente - el usuario debe hacer clic en "Siguiente" después de seleccionar
    autoAdvanceDelay: 1500,
    autoAction: {
      type: 'click',
      delayAfter: 1000,
    },
  },
  // === TRANSICIÓN A DETALLE DE PRODUCTO ===
  {
    id: 'transition-to-product-detail',
    route: '/products', // Mantener hasta que se navegue
    selector: '[data-tour="page-header-title"]',
    title: 'Cambiando a Detalle de Producto',
    description: 'Ahora vamos a ver los detalles del producto seleccionado. Haz clic en "Cargar página" para continuar.',
    position: 'bottom',
    waitForElement: false,
    delay: 100,
    autoAdvance: false, // Requiere confirmación manual del usuario
    autoAdvanceDelay: 1000,
  },
  // === PÁGINA DE DETALLE DE PRODUCTO (/products/:id) ===
  // Nota: La ruta será dinámica, se actualizará con el ID del producto seleccionado
  {
    id: 'product-detail-title',
    route: '/products/:id', // Se actualizará dinámicamente
    selector: '[data-tour="page-header-title"]',
    title: 'Detalles del Producto',
    description: 'Aquí puedes ver toda la información del producto: nombre, categoría, precio, stock e imagen.',
    position: 'bottom',
    waitForElement: true,
    delay: 500,
    autoAdvance: true,
    autoAdvanceDelay: 2500,
  },
  {
    id: 'product-detail-movements',
    route: '/products/:id', // Se actualizará dinámicamente
    selector: '.product-movements-list, .product-movements-loading, .empty-state',
    title: 'Historial de Movimientos',
    description: 'Aquí puedes ver el historial completo de movimientos de stock: recargas, ventas y ajustes.',
    position: 'top',
    waitForElement: true,
    delay: 500,
    autoAdvance: true,
    autoAdvanceDelay: 3000, // Más tiempo para esperar carga de movimientos
  },
  // === EXPANDIR VISTA DE PRODUCTO PARA VER ACCIONES ===
  {
    id: 'product-detail-expand-before-recharge',
    route: '/products/:id',
    selector: '[data-tour="product-summary-view"], [data-tour="product-expand-button"]',
    title: 'Expandir Detalles del Producto',
    description: 'Haz clic aquí para expandir y ver todos los detalles del producto, incluyendo las acciones disponibles como recargar stock.',
    position: 'bottom',
    waitForElement: true,
    delay: 500,
    autoAdvance: true,
    autoAdvanceDelay: 2000,
    autoAction: {
      type: 'click',
      delayAfter: 800,
    },
  },
  {
    id: 'product-detail-section-explanation',
    route: '/products/:id',
    selector: '[data-tour="product-detail-section"]',
    title: 'Detalles del Producto',
    description: 'Aquí puedes ver toda la información del producto: nombre, categoría, precio por gramo, stock actual, descripción e imagen. También puedes realizar acciones como recargar stock, editar o eliminar el producto.',
    position: 'top',
    waitForElement: true,
    delay: 500,
    autoAdvance: true,
    autoAdvanceDelay: 4000,
  },
  {
    id: 'product-detail-recharge-action',
    route: '/products/:id',
    selector: '[data-tour="recharge-stock"]',
    title: 'Recargar Stock',
    description: 'Haz clic en "Recargar Stock" para agregar más inventario al producto.',
    position: 'top',
    waitForElement: true,
    delay: 300,
    autoAdvance: true,
    autoAdvanceDelay: 2000,
    autoAction: {
      type: 'click',
      delayAfter: 800,
    },
  },
  {
    id: 'product-detail-recharge-grams-action',
    route: '/products/:id', // Se actualizará dinámicamente (modal abierto)
    selector: '[data-tour="recharge-stock-grams-input"]',
    title: 'Especificar Gramos',
    description: 'Indica cuántos gramos quieres agregar al stock.',
    position: 'bottom',
    waitForElement: true,
    delay: 300,
    autoAction: {
      type: 'click',
      delayAfter: 500,
    },
  },
  {
    id: 'product-detail-recharge-grams-type-action',
    route: '/products/:id', // Se actualizará dinámicamente (modal abierto)
    selector: '[data-tour="recharge-stock-grams-input"]',
    title: 'Escribiendo Gramos',
    description: 'Escribiendo 50 gramos...',
    position: 'bottom',
    waitForElement: true,
    delay: 200,
    autoAdvance: true,
    autoAdvanceDelay: 1500,
    autoAction: {
      type: 'type',
      value: '50',
      delayAfter: 800,
    },
  },
  {
    id: 'product-detail-recharge-submit-action',
    route: '/products/:id', // Se actualizará dinámicamente (modal abierto)
    selector: '[data-tour="recharge-stock-submit"]',
    title: 'Confirmar Recarga',
    description: 'Haz clic en "Recargar" para confirmar y agregar el stock al producto.',
    position: 'top',
    waitForElement: true,
    delay: 500,
    autoAction: {
      type: 'click',
      delayAfter: 1000,
    },
  },
  // === TRANSICIÓN A CLIENTES ===
  {
    id: 'transition-to-customers',
    route: '/products/:id', // Mantener hasta que se navegue
    selector: '[data-tour="page-header-title"]',
    title: 'Cambiando a Clientes',
    description: 'Ahora vamos a aprender a gestionar clientes. Haz clic en "Cargar página" para continuar.',
    position: 'bottom',
    waitForElement: false,
    delay: 100,
    autoAdvance: false, // Requiere confirmación manual del usuario
    autoAdvanceDelay: 1000,
  },
  // === PÁGINA DE LISTA DE CLIENTES (/customers) ===
  {
    id: 'customers-list-title',
    route: '/customers',
    selector: '[data-tour="page-header-title"]',
    title: 'Lista de Clientes',
    description: 'Aquí puedes ver todos tus clientes, buscar por nombre, PIN o teléfono.',
    position: 'bottom',
    waitForElement: true,
    delay: 500,
    autoAdvance: true,
    autoAdvanceDelay: 2000,
  },
  {
    id: 'customers-list-search-click',
    route: '/customers',
    selector: '[data-tour="customer-search"]',
    title: 'Buscar Cliente',
    description: 'Usa el campo de búsqueda para encontrar clientes por nombre, PIN o teléfono (mínimo 3 caracteres).',
    position: 'bottom',
    waitForElement: true,
    delay: 300,
    autoAction: {
      type: 'click',
      delayAfter: 500,
    },
  },
  {
    id: 'customers-list-search-type',
    route: '/customers',
    selector: '[data-tour="customer-search"]',
    title: 'Buscando Cliente',
    description: 'Escribiendo "Juan" para buscar clientes...',
    position: 'bottom',
    waitForElement: true,
    delay: 200,
    autoAdvance: true,
    autoAdvanceDelay: 2000, // Esperar debounce (300ms) + API call + margen
    autoAction: {
      type: 'type',
      value: 'Juan',
      delayAfter: 1500,
    },
  },
  {
    id: 'customers-list-create-button',
    route: '/customers',
    selector: '[data-tour="create-customer"]',
    title: 'Crear Nuevo Cliente',
    description: 'Haz clic en "+ Nuevo cliente" para agregar un cliente al sistema.',
    position: 'bottom',
    waitForElement: true,
    delay: 500,
    autoAdvance: true,
    autoAdvanceDelay: 2000,
    autoAction: {
      type: 'click',
      delayAfter: 1000,
    },
  },
  // === TRANSICIÓN A CREAR CLIENTE ===
  {
    id: 'transition-to-customer-create',
    route: '/customers', // Mantener hasta que se navegue
    selector: '[data-tour="page-header-title"]',
    title: 'Cambiando a Crear Cliente',
    description: 'Ahora vamos a crear un nuevo cliente. Haz clic en "Cargar página" para continuar.',
    position: 'bottom',
    waitForElement: false,
    delay: 100,
    autoAdvance: false, // Requiere confirmación manual del usuario
    autoAdvanceDelay: 1000,
  },
  // === PÁGINA DE CREAR CLIENTE (/customers/new) ===
  {
    id: 'customer-create-title',
    route: '/customers/new',
    selector: '[data-tour="page-header-title"]',
    title: 'Crear Cliente',
    description: 'Completa el formulario para agregar un nuevo cliente al sistema.',
    position: 'bottom',
    waitForElement: true,
    delay: 500,
    autoAdvance: true,
    autoAdvanceDelay: 2000,
  },
  {
    id: 'customer-create-name-click',
    route: '/customers/new',
    selector: '[data-tour="customer-name-input"]',
    title: 'Nombre del Cliente',
    description: 'Escribe el nombre completo del cliente. Este campo es obligatorio.',
    position: 'bottom',
    waitForElement: true,
    delay: 300,
    autoAction: {
      type: 'click',
      delayAfter: 500,
    },
  },
  {
    id: 'customer-create-name-type',
    route: '/customers/new',
    selector: '[data-tour="customer-name-input"]',
    title: 'Escribiendo Nombre',
    description: 'Escribiendo nombre del cliente...',
    position: 'bottom',
    waitForElement: true,
    delay: 200,
    autoAdvance: true,
    autoAdvanceDelay: 1500,
    autoAction: {
      type: 'type',
      value: 'Cliente Demo Tour',
      delayAfter: 800,
    },
  },
  {
    id: 'customer-create-phone-click',
    route: '/customers/new',
    selector: '[data-tour="customer-phone-input"]',
    title: 'Teléfono',
    description: 'Añade el teléfono del cliente (opcional).',
    position: 'bottom',
    waitForElement: true,
    delay: 300,
    autoAction: {
      type: 'click',
      delayAfter: 500,
    },
  },
  {
    id: 'customer-create-phone-type',
    route: '/customers/new',
    selector: '[data-tour="customer-phone-input"]',
    title: 'Escribiendo Teléfono',
    description: 'Escribiendo teléfono...',
    position: 'bottom',
    waitForElement: true,
    delay: 200,
    autoAdvance: true,
    autoAdvanceDelay: 1500,
    autoAction: {
      type: 'type',
      value: '+54 11 1234-5678',
      delayAfter: 800,
    },
  },
  {
    id: 'customer-create-pin-click',
    route: '/customers/new',
    selector: '[data-tour="customer-pin-input"]',
    title: 'PIN del Cliente',
    description: 'El PIN debe tener exactamente 2 números y 2 letras (ej: 12AB). El sistema verificará que esté disponible.',
    position: 'bottom',
    waitForElement: true,
    delay: 300,
    autoAction: {
      type: 'click',
      delayAfter: 500,
    },
  },
  {
    id: 'customer-create-pin-type',
    route: '/customers/new',
    selector: '[data-tour="customer-pin-input"]',
    title: 'Escribiendo PIN',
    description: 'Escribiendo PIN...',
    position: 'bottom',
    waitForElement: true,
    delay: 200,
    autoAdvance: true,
    autoAdvanceDelay: 2000, // Más tiempo para verificar disponibilidad
    autoAction: {
      type: 'type',
      value: '12AB',
      delayAfter: 1500,
    },
  },
  {
    id: 'customer-create-subscription-type',
    route: '/customers/new',
    selector: '[data-tour="customer-subscription-type"]',
    title: 'Tipo de Suscripción',
    description: 'Selecciona si la suscripción es mensual o anual.',
    position: 'bottom',
    waitForElement: true,
    delay: 500,
    autoAdvance: true,
    autoAdvanceDelay: 2000,
    autoAction: {
      type: 'select',
      value: 'first-option',
      delayAfter: 500,
    },
  },
  {
    id: 'customer-create-subscription-price-click',
    route: '/customers/new',
    selector: '[data-tour="customer-subscription-price"]',
    title: 'Precio de Suscripción',
    description: 'Establece el precio de la suscripción.',
    position: 'bottom',
    waitForElement: true,
    delay: 300,
    autoAction: {
      type: 'click',
      delayAfter: 500,
    },
  },
  {
    id: 'customer-create-subscription-price-type',
    route: '/customers/new',
    selector: '[data-tour="customer-subscription-price"]',
    title: 'Escribiendo Precio',
    description: 'Escribiendo precio de suscripción...',
    position: 'bottom',
    waitForElement: true,
    delay: 200,
    autoAdvance: true,
    autoAdvanceDelay: 1500,
    autoAction: {
      type: 'type',
      value: '50',
      delayAfter: 800,
    },
  },
  {
    id: 'customer-create-notes-click',
    route: '/customers/new',
    selector: '[data-tour="customer-notes-input"]',
    title: 'Notas Adicionales',
    description: 'Añade información adicional sobre el cliente (opcional).',
    position: 'bottom',
    waitForElement: true,
    delay: 300,
    autoAction: {
      type: 'click',
      delayAfter: 500,
    },
  },
  {
    id: 'customer-create-notes-type',
    route: '/customers/new',
    selector: '[data-tour="customer-notes-input"]',
    title: 'Escribiendo Notas',
    description: 'Escribiendo notas...',
    position: 'bottom',
    waitForElement: true,
    delay: 200,
    autoAdvance: true,
    autoAdvanceDelay: 1500,
    autoAction: {
      type: 'type',
      value: 'Cliente creado durante el tour de onboarding',
      delayAfter: 800,
    },
  },
  {
    id: 'customer-create-save',
    route: '/customers/new',
    selector: '[data-tour="save-customer"]',
    title: 'Guardar Cliente',
    description: 'Cuando todos los campos obligatorios estén completos, haz clic en "Guardar cliente" para crear el cliente.',
    position: 'top',
    waitForElement: true,
    delay: 500,
  },
  // === TRANSICIÓN A DETALLE DE CLIENTE ===
  {
    id: 'transition-to-customer-detail',
    route: '/customers/new', // Mantener hasta que se navegue
    selector: '[data-tour="page-header-title"]',
    title: 'Cambiando a Detalle de Cliente',
    description: 'Ahora vamos a ver el perfil completo del cliente creado. Haz clic en "Cargar página" para continuar.',
    position: 'bottom',
    waitForElement: false,
    delay: 100,
    autoAdvance: false, // Requiere confirmación manual del usuario
    autoAdvanceDelay: 1000,
  },
  // === PÁGINA DE DETALLE DE CLIENTE (/customers/:id) ===
  {
    id: 'customer-detail-title',
    route: '/customers/:id', // Se actualizará dinámicamente
    selector: '[data-tour="customer-detail"]',
    title: 'Perfil del Cliente',
    description: 'Aquí puedes ver toda la información del cliente: datos personales, suscripción y más.',
    position: 'bottom',
    waitForElement: true,
    delay: 500,
    autoAdvance: true,
    autoAdvanceDelay: 2500,
  },
  {
    id: 'customer-detail-info-tab',
    route: '/customers/:id',
    selector: '[data-tour="customer-tab-info"]',
    title: 'Información del Cliente',
    description: 'En esta pestaña puedes ver los datos del cliente: nombre, teléfono, PIN y suscripción.',
    position: 'top',
    waitForElement: true,
    delay: 500,
    autoAdvance: true,
    autoAdvanceDelay: 3000,
  },
  {
    id: 'customer-detail-history-tab',
    route: '/customers/:id',
    selector: '[data-tour="purchase-history"]',
    title: 'Historial de Compras',
    description: 'Cambia a la pestaña "Historial" para ver todas las compras realizadas por este cliente.',
    position: 'top',
    waitForElement: true,
    delay: 500,
    autoAdvance: true,
    autoAdvanceDelay: 2000,
    autoAction: {
      type: 'click',
      delayAfter: 1000,
    },
  },
  {
    id: 'customer-detail-summary-tab',
    route: '/customers/:id',
    selector: '[data-tour="customer-summary"]',
    title: 'Resumen de Compras',
    description: 'En la pestaña "Resumen" puedes ver un análisis de las compras: total gastado y gramos por producto.',
    position: 'top',
    waitForElement: true,
    delay: 500,
    autoAdvance: true,
    autoAdvanceDelay: 3000,
    autoAction: {
      type: 'click',
      delayAfter: 1000,
    },
  },
];

// Mantener TOUR_STEPS para compatibilidad (apunta a fase 1)
export const TOUR_STEPS = TOUR_STEPS_PHASE1;

// Constante para sessionStorage (solo para saber si el tour está iniciado)
const TOUR_STARTED_KEY = 'onboarding_tour_started';

export function useOnboardingTour() {
  const navigate = useNavigate();
  const { completeFunctionalOnboarding } = useConfig();
  const { deactivateDemoMode, demoData } = useDemo();
  const { loadProducts, products } = useProducts();
  const { loadCustomers, customers } = useCustomers();
  
  // El paso siempre empieza en 0 - no se persiste
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [isTourStarted, setIsTourStarted] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const elementCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tourStartedRef = useRef(false);
  const lastSearchedStepRef = useRef<number>(-1);
  const searchAttemptsRef = useRef<Map<string, number>>(new Map());
  const navigatingRef = useRef(false);
  const lastNavigatedStepRef = useRef<number>(-1);
  const isUpdatingElementRef = useRef(false);
  // Ref para almacenar el ID del producto seleccionado (para navegación dinámica)
  const selectedProductIdRef = useRef<string | null>(null);
  const pendingProductClickRef = useRef<HTMLElement | null>(null);
  // Ref para almacenar el ID del cliente seleccionado (para navegación dinámica)
  const selectedCustomerIdRef = useRef<string | null>(null);
  const pendingCustomerClickRef = useRef<HTMLElement | null>(null);
  // Refs para almacenar las funciones y evitar recrearlas
  const waitForElementRef = useRef<typeof waitForElement>();
  const findTargetElementRef = useRef<typeof findTargetElement>();
  const startTourRef = useRef<(() => Promise<void>) | null>(null);
  
  // Usar useMemo para evitar recrear el array en cada render
  const TOUR_STEPS = useMemo(() => TOUR_STEPS_PHASE1, []);

  // Buscar elemento objetivo en el DOM
  // IMPORTANTE: Busca en todo el documento, incluyendo modales renderizados en portales
  const findTargetElement = useCallback((selector: string): HTMLElement | null => {
    console.log(`[OnboardingTour] Buscando elemento con selector: ${selector}`);
    console.log(`[OnboardingTour] URL actual: ${window.location.pathname}`);
    console.log(`[OnboardingTour] Contenedor sale-create-container existe:`, !!document.querySelector('.sale-create-container'));
    console.log(`[OnboardingTour] PageHeader existe:`, !!document.querySelector('.page-header'));
    
    try {
      // Intentar selección directa en todo el documento (incluye modales en portales)
      let element = document.querySelector(selector) as HTMLElement;
      if (element) {
        console.log(`[OnboardingTour] ✓ Elemento encontrado directamente: ${selector}`);
        return element;
      }
      console.log(`[OnboardingTour] ✗ No se encontró con selección directa: ${selector}`);

      // Si el selector es un atributo data-tour, buscar por ese atributo
      if (selector.startsWith('[data-tour=') || selector.startsWith('[data-tour="')) {
        // Manejar selectores que empiezan con ^= (empieza con)
        if (selector.includes('^=')) {
          const tourValue = selector.match(/data-tour\^=["']?([^"']+)["']?/)?.[1];
          console.log(`[OnboardingTour] Buscando data-tour que empiece con: ${tourValue}`);
          if (tourValue) {
            // Buscar el primer elemento cuyo data-tour empiece con el valor
            const allElements = document.querySelectorAll('[data-tour]');
            console.log(`[OnboardingTour] Elementos con data-tour encontrados: ${allElements.length}`);
            for (const el of allElements) {
              const tourAttr = el.getAttribute('data-tour');
              console.log(`[OnboardingTour]   - data-tour="${tourAttr}"`);
              if (tourAttr && tourAttr.startsWith(tourValue)) {
                console.log(`[OnboardingTour] ✓ Elemento encontrado con data-tour^=: ${tourAttr}`);
                return el as HTMLElement;
              }
            }
          }
        } else {
          // Selector normal de data-tour
          const tourValue = selector.match(/data-tour=["']?([^"']+)["']?/)?.[1];
          console.log(`[OnboardingTour] Buscando data-tour exacto: ${tourValue}`);
          if (tourValue) {
            element = document.querySelector(`[data-tour="${tourValue}"]`) as HTMLElement;
            if (element) {
              console.log(`[OnboardingTour] ✓ Elemento encontrado con data-tour: ${tourValue}`);
              return element;
            }
            console.log(`[OnboardingTour] ✗ No se encontró elemento con data-tour="${tourValue}"`);
            // Listar todos los data-tour disponibles para debug
            const allTourElements = document.querySelectorAll('[data-tour]');
            console.log(`[OnboardingTour] Elementos con data-tour disponibles:`, Array.from(allTourElements).map(el => el.getAttribute('data-tour')));
          }
        }
      }

      // Si es un selector de .page-header-title, buscar de manera más flexible
      if (selector === '.page-header-title') {
        // Buscar por data-tour primero
        element = document.querySelector('[data-tour="page-header-title"]') as HTMLElement;
        if (element) return element;
        
        // Buscar directamente
        element = document.querySelector('.page-header-title') as HTMLElement;
        if (element) return element;
        
        // Buscar dentro de .page-header
        const pageHeader = document.querySelector('.page-header');
        if (pageHeader) {
          element = pageHeader.querySelector('.page-header-title') as HTMLElement;
          if (element) return element;
          
          // Buscar cualquier h1 dentro del page-header
          const h1 = pageHeader.querySelector('h1');
          if (h1) return h1 as HTMLElement;
        }
        
        // Buscar cualquier h1 en la página como último recurso
        const anyH1 = document.querySelector('h1');
        if (anyH1) return anyH1 as HTMLElement;
      }

      // Si es un selector de botón en page-header, buscar el primer botón
      if (selector === '.page-header button') {
        const pageHeader = document.querySelector('.page-header');
        if (pageHeader) {
          const button = pageHeader.querySelector('button');
          if (button) return button as HTMLElement;
        }
      }

      // Fallback: buscar por texto en botones si el selector no funciona
      const allButtons = document.querySelectorAll('button');
      for (const button of allButtons) {
        if (button.textContent?.trim().toLowerCase().includes('nuevo')) {
          return button as HTMLElement;
        }
      }

      console.log(`[OnboardingTour] ✗ No se encontró elemento después de todos los intentos: ${selector}`);
      return null;
    } catch (error) {
      console.error('[OnboardingTour] Error buscando elemento:', selector, error);
      return null;
    }
  }, []);

  // Esperar a que un elemento aparezca en el DOM
  const waitForElement = useCallback(
    (selector: string, timeout = 10000): Promise<HTMLElement | null> => {
      console.log(`[OnboardingTour] Esperando elemento: ${selector} (timeout: ${timeout}ms)`);
      return new Promise((resolve) => {
        const startTime = Date.now();
        let checkCount = 0;
        
        const checkElement = () => {
          checkCount++;
          const findFn = findTargetElementRef.current || findTargetElement;
          const element = findFn(selector);
          if (element) {
            console.log(`[OnboardingTour] ✓ Elemento encontrado después de ${checkCount} intentos (${Date.now() - startTime}ms): ${selector}`);
            resolve(element);
            return;
          }
          
          // Log cada 10 intentos
          if (checkCount % 10 === 0) {
            console.log(`[OnboardingTour] Intento ${checkCount} - Elemento aún no encontrado: ${selector} (${Date.now() - startTime}ms transcurridos)`);
          }

          // Si es .page-header-title y ya pasó suficiente tiempo, intentar buscar de manera más agresiva
          if (selector === '.page-header-title' && checkCount > 10) {
            // Esperar un poco más y buscar en el DOM completo
            setTimeout(() => {
              const element = findFn(selector);
              resolve(element);
            }, 500);
            return;
          }

          if (Date.now() - startTime > timeout) {
            console.warn(`[OnboardingTour] ✗ Timeout esperando elemento: ${selector} después de ${checkCount} intentos (${Date.now() - startTime}ms)`);
            resolve(null);
            return;
          }

          // Usar interval más corto al principio, más largo después
          const delay = checkCount < 20 ? 100 : 200;
          setTimeout(checkElement, delay);
        };

        checkElement();
      });
    },
    [] // Sin dependencias - usamos ref
  );
  
  // Actualizar refs cuando cambian las funciones
  useEffect(() => {
    findTargetElementRef.current = findTargetElement;
    waitForElementRef.current = waitForElement;
  }, [findTargetElement, waitForElement]);

  // Ir a un paso específico - simplificado sin navegación real
  // OnboardingTourPage ya renderiza la página correcta según currentStepData.route
  const goToStep = useCallback(
    async (stepIndex: number) => {
      console.log(`[OnboardingTour] goToStep(${stepIndex}) llamado`);
      console.log(`[OnboardingTour] Validación: stepIndex=${stepIndex}, TOUR_STEPS.length=${TOUR_STEPS.length}, currentStep=${currentStep}`);
      
      if (stepIndex < 0 || stepIndex >= TOUR_STEPS.length) {
        console.log(`[OnboardingTour] ✗ goToStep cancelado: índice fuera de rango`);
        return;
      }

      // Evitar navegaciones repetidas al mismo paso
      if (navigatingRef.current && lastNavigatedStepRef.current === stepIndex) {
        console.log(`[OnboardingTour] ✗ goToStep cancelado: ya navegando al mismo paso (${stepIndex})`);
        return;
      }

      const step = TOUR_STEPS[stepIndex];
      
      // Si la ruta tiene :id y tenemos un producto seleccionado, reemplazarlo
      let actualRoute = step.route;
      if (actualRoute.includes('/products/:id') && selectedProductIdRef.current) {
        actualRoute = actualRoute.replace('/products/:id', `/products/${selectedProductIdRef.current}`);
        console.log(`[OnboardingTour] Ruta dinámica actualizada: ${step.route} -> ${actualRoute}`);
      }
      
      // Si la ruta tiene :id y tenemos un cliente seleccionado, reemplazarlo
      if (actualRoute.includes('/customers/:id') && selectedCustomerIdRef.current) {
        actualRoute = actualRoute.replace('/customers/:id', `/customers/${selectedCustomerIdRef.current}`);
        console.log(`[OnboardingTour] Ruta dinámica de cliente actualizada: ${step.route} -> ${actualRoute}`);
      }
      
      console.log(`[OnboardingTour] Paso objetivo: ${step.id} - "${step.title}" en ruta ${actualRoute}`);
      
      // Si ya estamos navegando, esperar a que termine
      if (navigatingRef.current) {
        console.log(`[OnboardingTour] Esperando a que termine navegación anterior...`);
        let waitCount = 0;
        while (navigatingRef.current && waitCount < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          waitCount++;
        }
        console.log(`[OnboardingTour] Navegación anterior completada después de ${waitCount} intentos`);
      }

      navigatingRef.current = true;
      lastNavigatedStepRef.current = stepIndex;
      
      // Establecer el paso (esto también guarda en sessionStorage)
      console.log(`[OnboardingTour] Estableciendo paso ${stepIndex}`);
      console.log(`[OnboardingTour] Ruta del paso: ${actualRoute}`);
      
      // Detectar paso de transición
      const isTransitionStep = step.id === 'transition-to-products' || 
                               step.id === 'transition-to-products-list' ||
                               step.id === 'transition-to-product-detail' ||
                               step.id === 'transition-to-customers' ||
                               step.id === 'transition-to-customer-create' ||
                               step.id === 'transition-to-customer-detail';
      if (isTransitionStep) {
        console.log(`[OnboardingTour] 🔄 Paso de transición detectado - OnboardingTourPage renderizará la nueva página`);
      }
      
      setCurrentStep(stepIndex);
      
      // Esperar un momento para que React procese el cambio de estado
      // Si cambia la ruta o es paso de transición, necesitamos más tiempo para que React re-renderice la página
      const previousStep = stepIndex > 0 ? TOUR_STEPS[stepIndex - 1] : null;
      let previousRoute = previousStep?.route || '';
      // Si la ruta anterior tenía :id, usar la ruta actualizada si existe
      if (previousRoute.includes('/products/:id') && selectedProductIdRef.current) {
        previousRoute = previousRoute.replace('/products/:id', `/products/${selectedProductIdRef.current}`);
      }
      if (previousRoute.includes('/customers/:id') && selectedCustomerIdRef.current) {
        previousRoute = previousRoute.replace('/customers/:id', `/customers/${selectedCustomerIdRef.current}`);
      }
      const routeChanged = previousStep && previousRoute !== actualRoute;
      
      if (routeChanged || isTransitionStep) {
        let targetRoute = actualRoute;
        if (isTransitionStep && step.id === 'transition-to-products') {
          targetRoute = '/products/new';
        } else if (isTransitionStep && step.id === 'transition-to-products-list') {
          targetRoute = '/products';
        } else if (isTransitionStep && step.id === 'transition-to-product-detail') {
          // La ruta será dinámica basada en el producto seleccionado
          if (selectedProductIdRef.current) {
            targetRoute = `/products/${selectedProductIdRef.current}`;
          } else {
            targetRoute = '/products/:id';
          }
        } else if (isTransitionStep && step.id === 'transition-to-customers') {
          targetRoute = '/customers';
        } else if (isTransitionStep && step.id === 'transition-to-customer-create') {
          targetRoute = '/customers/new';
        } else if (isTransitionStep && step.id === 'transition-to-customer-detail') {
          // La ruta será dinámica basada en el cliente seleccionado
          if (selectedCustomerIdRef.current) {
            targetRoute = `/customers/${selectedCustomerIdRef.current}`;
          } else {
            targetRoute = '/customers/:id';
          }
        }
        console.log(`[OnboardingTour] ⚠️ Cambio de ruta detectado: ${previousRoute || 'N/A'} -> ${targetRoute}`);
        console.log(`[OnboardingTour] Esperando tiempo adicional para que React re-renderice la nueva página...`);
        // Esperar más tiempo cuando cambia la ruta para que React re-renderice
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Determinar contenedor según la ruta del paso
      const targetRoute = actualRoute;
      const containerSelectors = targetRoute.includes('/sales/') 
        ? ['.sale-create-container']
        : targetRoute === '/products'
        ? ['.products-page-container']
        : targetRoute.includes('/products/')
        ? ['.product-create-container', '.product-detail-container']
        : targetRoute === '/customers'
        ? ['.customers-page-container']
        : targetRoute.includes('/customers/')
        ? ['.customer-create-container', '.customer-detail-container']
        : ['.sale-create-container']; // Por defecto
      
      console.log(`[OnboardingTour] Paso ${stepIndex}: ${step.id} - Esperando que la página se renderice...`);
      console.log(`[OnboardingTour] Buscando contenedores: ${containerSelectors.join(', ')}`);
      
      // Esperar a que el contenedor esté disponible
      // Aumentar el número de intentos si cambió la ruta o es paso de transición
      const maxAttempts = (routeChanged || isTransitionStep) ? 50 : 30;
      let containerFound = false;
      let attempts = 0;
      while (!containerFound && attempts < maxAttempts) {
        for (const selector of containerSelectors) {
          const container = document.querySelector(selector);
          if (container) {
            console.log(`[OnboardingTour] ✓ Contenedor ${selector} encontrado después de ${attempts} intentos`);
            containerFound = true;
            break;
          }
        }
        if (!containerFound) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
          if (attempts % 10 === 0) {
            console.log(`[OnboardingTour] Intento ${attempts}/${maxAttempts} - Contenedor aún no encontrado...`);
          }
        }
      }
      
      if (!containerFound) {
        console.warn(`[OnboardingTour] ⚠️ Contenedor no encontrado después de ${attempts} intentos`);
        console.warn(`[OnboardingTour] Contenedores buscados: ${containerSelectors.join(', ')}`);
        console.warn(`[OnboardingTour] URL actual: ${window.location.pathname}`);
        console.warn(`[OnboardingTour] Ruta del paso: ${step.route}`);
        console.warn(`[OnboardingTour] Es paso de transición: ${isTransitionStep}`);
      }
      
      // Esperar tiempo adicional para que React termine de renderizar
      await new Promise(resolve => setTimeout(resolve, (routeChanged || isTransitionStep) ? 800 : 500));
      console.log(`[OnboardingTour] Continuando con búsqueda de elemento: ${step.selector}`);

      // Esperar delay si existe
      if (step.delay) {
        await new Promise((resolve) => setTimeout(resolve, step.delay));
      }

      // Lógica especial para paso de transición a lista de productos
      // NOTA: Esta lógica se maneja ahora mediante el botón "Cargar página" en SimpleOnboardingTour
      // El usuario debe hacer clic en el botón para avanzar, igual que con transition-to-products
      if (step.id === 'transition-to-products-list') {
        console.log(`[OnboardingTour] Paso de transición a lista de productos detectado - esperando confirmación del usuario`);
        // No avanzar automáticamente - el usuario debe hacer clic en "Cargar página"
        // El TourPageRenderer se encargará de renderizar ProductsPage cuando se dispare el evento
        navigatingRef.current = false;
        return;
      }

      // Lógica especial para paso de transición a detalle de producto
      // NOTA: Esta lógica se maneja ahora mediante el botón "Cargar página" en SimpleOnboardingTour
      // El usuario debe hacer clic en el botón para avanzar
      if (step.id === 'transition-to-product-detail') {
        console.log(`[OnboardingTour] Paso de transición a detalle de producto detectado - esperando confirmación del usuario`);
        // No avanzar automáticamente - el usuario debe hacer clic en "Cargar página"
        // El TourPageRenderer se encargará de renderizar ProductDetailPage cuando se dispare el evento
        navigatingRef.current = false;
        return;
      }
      
      // Lógica especial para pasos de transición de clientes
      if (step.id === 'transition-to-customers' || 
          step.id === 'transition-to-customer-create' || 
          step.id === 'transition-to-customer-detail') {
        console.log(`[OnboardingTour] Paso de transición de clientes detectado (${step.id}) - esperando confirmación del usuario`);
        // No avanzar automáticamente - el usuario debe hacer clic en "Cargar página"
        // El TourPageRenderer se encargará de renderizar la página correspondiente cuando se dispare el evento
        navigatingRef.current = false;
        return;
      }
      
      // Buscar elemento objetivo
      const waitFn = waitForElementRef.current || waitForElement;
      const findFn = findTargetElementRef.current || findTargetElement;
      let element: HTMLElement | null = null;
      
      if (step.waitForElement) {
        element = await waitFn(step.selector, 10000);
        setTargetElement(element);
        if (!element) {
          const attempts = searchAttemptsRef.current.get(step.selector) || 0;
          if (attempts === 0) {
            console.warn(`No se encontró el elemento ${step.selector} después de esperar`);
            searchAttemptsRef.current.set(step.selector, 1);
          }
        } else {
          searchAttemptsRef.current.delete(step.selector);
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 200));
        element = findFn(step.selector);
        setTargetElement(element);
        if (!element) {
          const attempts = searchAttemptsRef.current.get(step.selector) || 0;
          if (attempts === 0) {
            console.warn(`No se encontró el elemento ${step.selector}`);
            searchAttemptsRef.current.set(step.selector, 1);
          }
        } else {
          searchAttemptsRef.current.delete(step.selector);
        }
      }
      
      // Lógica especial para paso de movimientos: esperar a que se carguen
      if (step.id === 'product-detail-movements') {
        console.log(`[OnboardingTour] Esperando a que se carguen los movimientos...`);
        let movementsLoaded = false;
        let attempts = 0;
        const maxAttempts = 50; // 5 segundos máximo
        
        while (!movementsLoaded && attempts < maxAttempts) {
          // Verificar si hay movimientos cargados o si el loading terminó
          const movementsList = document.querySelector('.product-movements-list');
          const movementsLoading = document.querySelector('.product-movements-loading');
          const emptyState = document.querySelector('.empty-state'); // Si no hay movimientos
          
          // Si hay lista de movimientos o empty state, los movimientos ya se cargaron
          if (movementsList || emptyState) {
            console.log(`[OnboardingTour] ✓ Movimientos cargados (${movementsList ? 'con datos' : 'sin datos'})`);
            movementsLoaded = true;
            break;
          }
          
          // Si no hay loading, también asumir que se cargaron
          if (!movementsLoading) {
            console.log(`[OnboardingTour] ✓ Loading desapareció, movimientos cargados`);
            movementsLoaded = true;
            break;
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
          if (attempts % 10 === 0) {
            console.log(`[OnboardingTour] Intento ${attempts}/${maxAttempts} - Esperando movimientos...`);
          }
        }
        
        if (!movementsLoaded) {
          console.warn(`[OnboardingTour] ⚠️ Movimientos no cargados después de esperar, pero continuando...`);
        }
        
        // Esperar un poco más para asegurar que todo esté renderizado
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Ejecutar acción automática directamente en goToStep si existe
      if (element && step.autoAction) {
        console.log(`[OnboardingTour] [goToStep] Ejecutando acción automática: ${step.autoAction.type}${step.autoAction.value ? ` con valor "${step.autoAction.value}"` : ''}`);
        try {
          await executeAutoAction(step, element, stepIndex);
          console.log(`[OnboardingTour] [goToStep] ✓ Acción automática completada`);
        } catch (error) {
          console.error(`[OnboardingTour] [goToStep] ✗ Error ejecutando acción automática:`, error);
        }
      }
      
      // Marcar navegación como completada
      navigatingRef.current = false;
      console.log(`[OnboardingTour] Paso ${stepIndex} completado`);
    },
    [currentStep, setCurrentStep, TOUR_STEPS, navigate] // Incluir navigate en dependencias
  );

  // Completar tour
  const completeTour = useCallback(async () => {
    console.log('[OnboardingTour] Completando tour...');
    
    // Borrar datos de prueba antes de completar
    console.log('[OnboardingTour] Borrando datos de prueba...');
    try {
      await cleanupTestData();
      console.log('[OnboardingTour] ✓ Datos de prueba eliminados');
    } catch (error) {
      console.error('[OnboardingTour] Error eliminando datos de prueba:', error);
      // Continuar aunque falle la eliminación
    }
    
    // Limpiar sessionStorage (solo el flag de iniciado)
    sessionStorage.removeItem(TOUR_STARTED_KEY);
    deactivateDemoMode();
    completeFunctionalOnboarding();
    // Navegar a home después de completar
    navigate('/home', { replace: true });
  }, [deactivateDemoMode, completeFunctionalOnboarding, navigate]);

  // Saltar tour
  const skipTour = useCallback(() => {
    // Limpiar sessionStorage (solo el flag de iniciado)
    sessionStorage.removeItem(TOUR_STARTED_KEY);
    deactivateDemoMode();
    completeFunctionalOnboarding();
    navigate('/onboarding');
  }, [deactivateDemoMode, completeFunctionalOnboarding, navigate]);

  // Siguiente paso - simplificado, el paso 15 se encarga del cambio de página
  const nextStep = useCallback(() => {
    console.log(`[OnboardingTour] nextStep() llamado - currentStep: ${currentStep}, totalSteps: ${TOUR_STEPS.length}`);
    if (currentStep < TOUR_STEPS.length - 1) {
      const nextStepIndex = currentStep + 1;
      console.log(`[OnboardingTour] Avanzando al siguiente paso: ${nextStepIndex}`);
      goToStep(nextStepIndex);
    } else {
      console.log(`[OnboardingTour] Último paso alcanzado, completando tour`);
      completeTour();
    }
  }, [currentStep, goToStep, completeTour, TOUR_STEPS.length]);

  // Paso anterior
  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  // Iniciar tour - UN SOLO INICIO, sin fases separadas
  const startTour = useCallback(async () => {
    // Easter egg: verificar si hay parámetro force=true en la URL
    const searchParams = new URLSearchParams(window.location.search);
    const forceAccess = searchParams.get('force') === 'true';
    
    // Verificación triple: ref, estado y sessionStorage (a menos que sea acceso forzado)
    const tourStartedInSession = sessionStorage.getItem(TOUR_STARTED_KEY) === 'true';
    
    if (!forceAccess && (tourStartedRef.current || isTourStarted || tourStartedInSession)) {
      console.log(`[OnboardingTour] Tour ya iniciado (ref: ${tourStartedRef.current}, estado: ${isTourStarted}, sesión: ${tourStartedInSession}), ignorando...`);
      return;
    }
    
    // Si es acceso forzado, resetear todo antes de iniciar
    if (forceAccess) {
      console.log('[OnboardingTour] 🎯 Acceso forzado detectado, reiniciando tour...');
      tourStartedRef.current = false;
      setIsTourStarted(false);
      sessionStorage.removeItem(TOUR_STARTED_KEY);
    }
    
    // Marcar como iniciado INMEDIATAMENTE en los 3 lugares para evitar llamadas concurrentes
    sessionStorage.setItem(TOUR_STARTED_KEY, 'true');
    tourStartedRef.current = true;
    setIsTourStarted(true);
    
    // Resetear paso a 0 al iniciar
    setCurrentStep(0);
    
    console.log(`[OnboardingTour] Iniciando tour unificado (${TOUR_STEPS.length} pasos)...`);
    console.log('[OnboardingTour] URL actual:', window.location.pathname);
    
    setIsLoading(true);
    
    // Resetear los refs antes de navegar
    lastSearchedStepRef.current = -1;
    lastNavigatedStepRef.current = -1;
    navigatingRef.current = false;
    searchAttemptsRef.current.clear();
    
    // Determinar contenedor según el primer paso
    const firstStep = TOUR_STEPS[0];
    let containerSelector = '.sale-create-container'; // Por defecto
    if (firstStep.route.includes('/sales/')) {
      containerSelector = '.sale-create-container';
    } else if (firstStep.route === '/products') {
      containerSelector = '.products-page-container';
    } else if (firstStep.route.includes('/products/')) {
      containerSelector = '.product-create-container';
    } else if (firstStep.route === '/customers') {
      containerSelector = '.customers-page-container';
    } else if (firstStep.route.includes('/customers/')) {
      containerSelector = '.customer-create-container';
    }
    
    console.log(`[OnboardingTour] Esperando que la página se renderice...`);
    let pageReady = false;
    let readyAttempts = 0;
    while (!pageReady && readyAttempts < 30) {
      const container = document.querySelector(containerSelector);
      const pageHeader = document.querySelector('.page-header');
      if (container && pageHeader) {
        console.log(`[OnboardingTour] ✓ Página renderizada correctamente`);
        pageReady = true;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      readyAttempts++;
    }
    
    if (!pageReady) {
      console.warn(`[OnboardingTour] ⚠️ Página no completamente renderizada después de esperar`);
    }
    
    // Esperar un poco más para asegurar que todos los componentes estén listos
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Asegurar que isTourStarted esté establecido antes de navegar
    tourStartedRef.current = true;
    setIsTourStarted(true);
    
    // Navegar al primer paso (siempre paso 0)
    console.log(`[OnboardingTour] Iniciando primer paso...`);
    try {
      await goToStep(0);
      // Desactivar loading después de que el primer paso se haya cargado
      console.log(`[OnboardingTour] Tour iniciado, desactivando loading...`);
      setIsLoading(false);
    } catch (error) {
      console.error(`[OnboardingTour] Error iniciando tour:`, error);
      setIsLoading(false); // Asegurar que el loading se desactive incluso si hay error
      throw error;
    }
  }, [loadProducts, loadCustomers, goToStep, TOUR_STEPS]);
  
  // Actualizar el ref de startTour para que pueda ser llamado desde completeTour y skipTour
  useEffect(() => {
    startTourRef.current = startTour;
  }, [startTour]);

  // Ya no necesitamos resetear cuando cambia la fase - el tour es continuo

  // Limpiar intervalos al desmontar
  useEffect(() => {
    return () => {
      if (elementCheckIntervalRef.current) {
        clearInterval(elementCheckIntervalRef.current);
      }
    };
  }, []);

  // Ejecutar acción automática de forma directa y confiable
  const executeAutoAction = useCallback(async (step: TourStep, element: HTMLElement | null, currentStepIndex?: number) => {
    console.log(`[OnboardingTour] executeAutoAction llamado:`, {
      hasStep: !!step,
      hasAutoAction: !!step?.autoAction,
      hasElement: !!element,
      type: step?.autoAction?.type,
      value: step?.autoAction?.value,
    });
    
    if (!step.autoAction || !element) {
      console.log(`[OnboardingTour] executeAutoAction cancelado:`, {
        hasAutoAction: !!step.autoAction,
        hasElement: !!element,
      });
      return;
    }

    const { type, value, delayAfter = 0 } = step.autoAction;
    console.log(`[OnboardingTour] Ejecutando acción: type=${type}, value=${value}, delayAfter=${delayAfter}`);

    try {
      // Hacer scroll al elemento primero
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(resolve => setTimeout(resolve, 400));

      switch (type) {
        case 'click':
          // Click directo usando eventos reales
          if (element instanceof HTMLElement) {
            // Si el elemento es un product-row, NO hacer click todavía
            // Solo preparar el ID y avanzar al paso de transición
            // El click real se hará cuando el usuario haga clic en "Cargar página"
            const dataTourAttr = element.getAttribute('data-tour');
            console.log(`[OnboardingTour] 🔍 Verificando elemento product-row:`, {
              hasDataTour: !!dataTourAttr,
              dataTourValue: dataTourAttr,
              isProductRow: dataTourAttr?.startsWith('product-row-'),
              elementTag: element.tagName,
              elementClasses: element.className,
              elementId: element.id
            });
            
            if (dataTourAttr && dataTourAttr.startsWith('product-row-')) {
              const productId = dataTourAttr.replace('product-row-', '');
              console.log(`[OnboardingTour] ✅ Producto detectado!`, {
                dataTourAttribute: dataTourAttr,
                extractedProductId: productId,
                productIdLength: productId.length,
                productIdType: typeof productId,
                isValidId: productId && productId.length > 0
              });
              
              console.log(`[OnboardingTour] 💾 Guardando ID en selectedProductIdRef: ${productId}`);
              const previousId = selectedProductIdRef.current;
              selectedProductIdRef.current = productId;
              setSelectedProductId(productId); // Actualizar estado para que React detecte cambios
              console.log(`[OnboardingTour] ✅ ID guardado correctamente:`, {
                previousId: previousId,
                newId: selectedProductIdRef.current,
                idsMatch: previousId === selectedProductIdRef.current
              });
              
              // Actualizar las rutas dinámicas de los pasos siguientes
              if (currentStepIndex !== undefined && currentStepIndex >= 0) {
                console.log(`[OnboardingTour] 🔄 Actualizando rutas de pasos siguientes con ID: ${productId}`, {
                  currentStepIndex: currentStepIndex,
                  totalSteps: TOUR_STEPS.length,
                  stepsToUpdate: TOUR_STEPS.length - currentStepIndex - 1
                });
                
                // Actualizar rutas de los pasos siguientes que usan /products/:id
                let updatedStepsCount = 0;
                for (let i = currentStepIndex + 1; i < TOUR_STEPS.length; i++) {
                  const nextStep = TOUR_STEPS[i];
                  const previousRoute = nextStep.route;
                  
                  // Actualizar el paso de transición también si es necesario
                  if (nextStep.id === 'transition-to-product-detail') {
                    nextStep.route = `/products/${productId}`;
                    updatedStepsCount++;
                    console.log(`[OnboardingTour] ✅ Actualizada ruta del paso de transición ${i} (${nextStep.id})`, {
                      previousRoute: previousRoute,
                      newRoute: nextStep.route,
                      productId: productId
                    });
                  }
                  // Actualizar pasos que usan /products/:id
                  if (nextStep.route === '/products/:id' || nextStep.route.includes('/products/:id')) {
                    nextStep.route = `/products/${productId}`;
                    updatedStepsCount++;
                    console.log(`[OnboardingTour] ✅ Actualizada ruta del paso ${i} (${nextStep.id})`, {
                      previousRoute: previousRoute,
                      newRoute: nextStep.route,
                      productId: productId
                    });
                  }
                }
                
                console.log(`[OnboardingTour] ✅ Rutas actualizadas: ${updatedStepsCount} pasos modificados con ID ${productId}`);
              } else {
                console.warn(`[OnboardingTour] ⚠️ No se pueden actualizar rutas: currentStepIndex es ${currentStepIndex}`);
              }
              
              // NO hacer click todavía - solo avanzar al paso de transición
              // El click se hará cuando el usuario haga clic en "Cargar página"
              console.log(`[OnboardingTour] Avanzando automáticamente al paso de transición después de seleccionar producto`);
              // Guardar referencia al elemento para hacer click después
              pendingProductClickRef.current = element;
              // Avanzar al siguiente paso (que será el paso de transición) después del delay
              await new Promise(resolve => setTimeout(resolve, delayAfter));
              if (currentStepIndex !== undefined && currentStepIndex < TOUR_STEPS.length - 1) {
                goToStep(currentStepIndex + 1);
              }
              return; // Salir sin hacer click
            }
            
            // Si el elemento es un customer-row, NO hacer click todavía
            // Solo preparar el ID y avanzar al paso de transición
            // El click real se hará cuando el usuario haga clic en "Cargar página"
            if (dataTourAttr && dataTourAttr.startsWith('customer-row-')) {
              const customerId = dataTourAttr.replace('customer-row-', '');
              console.log(`[OnboardingTour] ✅ Cliente detectado!`, {
                dataTourAttribute: dataTourAttr,
                extractedCustomerId: customerId,
                customerIdLength: customerId.length,
                customerIdType: typeof customerId,
                isValidId: customerId && customerId.length > 0
              });
              
              console.log(`[OnboardingTour] 💾 Guardando ID en selectedCustomerIdRef: ${customerId}`);
              const previousId = selectedCustomerIdRef.current;
              selectedCustomerIdRef.current = customerId;
              setSelectedCustomerId(customerId); // Actualizar estado para que React detecte cambios
              console.log(`[OnboardingTour] ✅ ID guardado correctamente:`, {
                previousId: previousId,
                newId: selectedCustomerIdRef.current,
                idsMatch: previousId === selectedCustomerIdRef.current
              });
              
              // Actualizar las rutas dinámicas de los pasos siguientes
              if (currentStepIndex !== undefined && currentStepIndex >= 0) {
                console.log(`[OnboardingTour] 🔄 Actualizando rutas de pasos siguientes con ID: ${customerId}`, {
                  currentStepIndex: currentStepIndex,
                  totalSteps: TOUR_STEPS.length,
                  stepsToUpdate: TOUR_STEPS.length - currentStepIndex - 1
                });
                
                // Actualizar rutas de los pasos siguientes que usan /customers/:id
                let updatedStepsCount = 0;
                for (let i = currentStepIndex + 1; i < TOUR_STEPS.length; i++) {
                  const nextStep = TOUR_STEPS[i];
                  const previousRoute = nextStep.route;
                  
                  // Actualizar el paso de transición también si es necesario
                  if (nextStep.id === 'transition-to-customer-detail') {
                    nextStep.route = `/customers/${customerId}`;
                    updatedStepsCount++;
                    console.log(`[OnboardingTour] ✅ Actualizada ruta del paso de transición ${i} (${nextStep.id})`, {
                      previousRoute: previousRoute,
                      newRoute: nextStep.route,
                      customerId: customerId
                    });
                  }
                  // Actualizar pasos que usan /customers/:id
                  if (nextStep.route === '/customers/:id' || nextStep.route.includes('/customers/:id')) {
                    nextStep.route = `/customers/${customerId}`;
                    updatedStepsCount++;
                    console.log(`[OnboardingTour] ✅ Actualizada ruta del paso ${i} (${nextStep.id})`, {
                      previousRoute: previousRoute,
                      newRoute: nextStep.route,
                      customerId: customerId
                    });
                  }
                }
                
                console.log(`[OnboardingTour] ✅ Rutas actualizadas: ${updatedStepsCount} pasos modificados con ID ${customerId}`);
              } else {
                console.warn(`[OnboardingTour] ⚠️ No se pueden actualizar rutas: currentStepIndex es ${currentStepIndex}`);
              }
              
              // NO hacer click todavía - solo avanzar al paso de transición
              // El click se hará cuando el usuario haga clic en "Cargar página"
              console.log(`[OnboardingTour] Avanzando automáticamente al paso de transición después de seleccionar cliente`);
              // Guardar referencia al elemento para hacer click después
              pendingCustomerClickRef.current = element;
              // Avanzar al siguiente paso (que será el paso de transición) después del delay
              await new Promise(resolve => setTimeout(resolve, delayAfter));
              if (currentStepIndex !== undefined && currentStepIndex < TOUR_STEPS.length - 1) {
                goToStep(currentStepIndex + 1);
              }
              return; // Salir sin hacer click
            }
            
            // Si el elemento es create-customer, NO hacer click real (evitar navegación)
            // En su lugar, avanzar al paso de transición
            if (dataTourAttr === 'create-customer') {
              console.log(`[OnboardingTour] ⚠️ Botón "Crear cliente" detectado - NO haciendo click real para evitar navegación`);
              console.log(`[OnboardingTour] Avanzando al paso de transición en lugar de hacer click`);
              // No hacer click - avanzar al siguiente paso (que será el paso de transición)
              await new Promise(resolve => setTimeout(resolve, delayAfter));
              if (currentStepIndex !== undefined && currentStepIndex < TOUR_STEPS.length - 1) {
                goToStep(currentStepIndex + 1);
              }
              return; // Salir sin hacer click
            }
            
            // Si el elemento es save-customer, NO hacer submit automático
            // El usuario debe hacer clic manualmente o avanzar
            // Cuando se crea el cliente, el ID se capturará desde el contexto o la navegación
            if (dataTourAttr === 'save-customer') {
              console.log(`[OnboardingTour] ⚠️ Botón "Guardar cliente" detectado - NO haciendo submit automático`);
              console.log(`[OnboardingTour] El usuario debe hacer clic manualmente o avanzar al siguiente paso`);
              // No hacer click - solo esperar
              await new Promise(resolve => setTimeout(resolve, delayAfter));
              return; // Salir sin hacer click
            }
            
            // Para otros elementos, hacer click normalmente
            // Crear y disparar eventos de mouse reales
            const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
            const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true, cancelable: true });
            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
            
            element.dispatchEvent(mouseDownEvent);
            await new Promise(resolve => setTimeout(resolve, 50));
            element.dispatchEvent(mouseUpEvent);
            await new Promise(resolve => setTimeout(resolve, 50));
            element.dispatchEvent(clickEvent);
            
            // También llamar al método click por si acaso
            element.click();
          }
          break;

        case 'type':
          // Para inputs controlados de React, necesitamos acceder al input HTML real
          // El elemento puede ser el wrapper, así que buscamos el input dentro si es necesario
          // También buscar en modales (portales) que pueden estar fuera del contenedor principal
          let inputElement: HTMLInputElement | null = null;
          
          if (element instanceof HTMLInputElement) {
            inputElement = element;
          } else {
            // Si no es un input directo, buscar el input dentro del elemento
            inputElement = element.querySelector('input') as HTMLInputElement;
            
            // Si no se encuentra, buscar en todo el documento (para modales en portales)
            if (!inputElement) {
              // Buscar por el data-tour del elemento padre
              const dataTour = element.getAttribute('data-tour');
              if (dataTour) {
                const foundInput = document.querySelector(`[data-tour="${dataTour}"] input`) as HTMLInputElement;
                if (foundInput) {
                  inputElement = foundInput;
                  console.log(`[OnboardingTour] Input encontrado en modal/portal con data-tour: ${dataTour}`);
                }
              }
            }
          }
          
          if (inputElement && value) {
            console.log('[OnboardingTour] Escribiendo texto en input:', value);
            console.log('[OnboardingTour] Input encontrado:', inputElement);
            console.log('[OnboardingTour] Valor actual del input:', inputElement.value);
            console.log('[OnboardingTour] Tipo del input:', inputElement.type);
            
            // Para NumberInput, puede ser un input dentro de un wrapper
            // Si el input no acepta el valor directamente, buscar el input real
            if (inputElement.type === 'text' && inputElement.closest('.number-input')) {
              // Es un NumberInput, el input real puede estar dentro
              const realInput = inputElement.closest('.number-input')?.querySelector('input[type="number"]') as HTMLInputElement;
              if (realInput) {
                console.log('[OnboardingTour] NumberInput detectado, usando input real');
                inputElement = realInput;
              }
            }
            
            inputElement.focus();
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Obtener el setter nativo para poder cambiar el valor
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              'value'
            )?.set;
            
            // Limpiar el input primero
            if (nativeInputValueSetter) {
              nativeInputValueSetter.call(inputElement, '');
            } else {
              inputElement.value = '';
            }
            
            // Disparar evento de limpieza
            const clearInputEvent = new InputEvent('input', {
              bubbles: true,
              cancelable: true,
              inputType: 'deleteContentBackward',
            });
            inputElement.dispatchEvent(clearInputEvent);
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Escribir carácter por carácter para simular escritura real
            let accumulatedValue = '';
            for (let i = 0; i < value.length; i++) {
              const char = value[i];
              accumulatedValue += char;
              
              // Establecer el valor usando el setter nativo (bypassa React)
              if (nativeInputValueSetter) {
                nativeInputValueSetter.call(inputElement, accumulatedValue);
              } else {
                inputElement.value = accumulatedValue;
              }
              
              // Disparar eventos de teclado para cada carácter
              const keyDownEvent = new KeyboardEvent('keydown', {
                bubbles: true,
                cancelable: true,
                key: char,
                code: char === ' ' ? 'Space' : `Key${char.toUpperCase()}`,
                charCode: char.charCodeAt(0),
                keyCode: char === ' ' ? 32 : char.toUpperCase().charCodeAt(0),
              });
              
              const keyPressEvent = new KeyboardEvent('keypress', {
                bubbles: true,
                cancelable: true,
                key: char,
                code: char === ' ' ? 'Space' : `Key${char.toUpperCase()}`,
                charCode: char.charCodeAt(0),
                keyCode: char === ' ' ? 32 : char.toUpperCase().charCodeAt(0),
              });
              
              // Disparar evento de input con el carácter específico
              const inputEvent = new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                data: char,
                inputType: 'insertText',
                isComposing: false,
              });
              
              const keyUpEvent = new KeyboardEvent('keyup', {
                bubbles: true,
                cancelable: true,
                key: char,
                code: char === ' ' ? 'Space' : `Key${char.toUpperCase()}`,
                charCode: char.charCodeAt(0),
                keyCode: char === ' ' ? 32 : char.toUpperCase().charCodeAt(0),
              });
              
              // Disparar eventos en el orden correcto
              inputElement.dispatchEvent(keyDownEvent);
              inputElement.dispatchEvent(keyPressEvent);
              inputElement.dispatchEvent(inputEvent);
              inputElement.dispatchEvent(keyUpEvent);
              
              // Pequeño delay entre caracteres para simular escritura real
              await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            // Disparar evento change final
            const changeEvent = new Event('change', { bubbles: true, cancelable: true });
            inputElement.dispatchEvent(changeEvent);
            
            // También disparar un evento input final con el valor completo
            const finalInputEvent = new InputEvent('input', {
              bubbles: true,
              cancelable: true,
              data: value,
              inputType: 'insertText',
            });
            inputElement.dispatchEvent(finalInputEvent);
            
            // Verificar que el valor se estableció correctamente
            console.log('[OnboardingTour] Valor después de escribir:', inputElement.value);
            console.log('[OnboardingTour] Valor esperado:', value);
            
            // Esperar a que React procese el cambio
            await new Promise(resolve => setTimeout(resolve, 300));
          } else {
            console.warn('[OnboardingTour] No se pudo encontrar el input HTML para escribir');
          }
          break;

        case 'select':
          // Para selects HTML nativos o elementos de lista (como resultados de búsqueda)
          if (value === 'first') {
            // Seleccionar el primer resultado de la lista
            // Esperar a que aparezcan los resultados (máximo 3 segundos)
            let firstResult: HTMLElement | null = null;
            let attempts = 0;
            const maxAttempts = 30; // 30 * 100ms = 3 segundos
            
            console.log('[OnboardingTour] Esperando a que aparezcan los resultados de búsqueda...');
            while (!firstResult && attempts < maxAttempts) {
              firstResult = document.querySelector('[data-tour^="customer-row-"]') as HTMLElement;
              if (!firstResult) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
              }
            }
            
            if (firstResult) {
              console.log('[OnboardingTour] ✓ Resultado encontrado, seleccionando automáticamente');
              // Hacer click en el primer resultado
              const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
              const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true, cancelable: true });
              const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
              
              firstResult.dispatchEvent(mouseDownEvent);
              await new Promise(resolve => setTimeout(resolve, 50));
              firstResult.dispatchEvent(mouseUpEvent);
              await new Promise(resolve => setTimeout(resolve, 50));
              firstResult.dispatchEvent(clickEvent);
              firstResult.click();
            } else {
              console.warn('[OnboardingTour] ⚠️ No se encontró ningún resultado para seleccionar después de esperar');
            }
          } else if (value === 'first-option' && element instanceof HTMLSelectElement) {
            // Seleccionar la primera opción disponible en un select HTML nativo
            // (índice 1, ya que índice 0 suele ser "Seleccione una categoría")
            console.log('[OnboardingTour] Esperando a que el select tenga opciones disponibles...');
            let selectReady = false;
            let attempts = 0;
            const maxAttempts = 50; // 50 * 100ms = 5 segundos
            
            while (!selectReady && attempts < maxAttempts) {
              if (element.options.length > 1) {
                // Seleccionar la primera opción real (índice 1)
                const firstOptionValue = element.options[1].value;
                if (firstOptionValue) {
                  console.log(`[OnboardingTour] Seleccionando primera opción disponible: ${firstOptionValue}`);
                  element.focus();
                  element.value = firstOptionValue;
                  element.dispatchEvent(new Event('change', { bubbles: true }));
                  element.dispatchEvent(new Event('input', { bubbles: true }));
                  selectReady = true;
                } else {
                  await new Promise(resolve => setTimeout(resolve, 100));
                  attempts++;
                }
              } else {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
              }
            }
            
            if (!selectReady) {
              console.warn('[OnboardingTour] ⚠️ No se encontraron opciones disponibles en el select después de esperar');
            }
          } else if (element instanceof HTMLSelectElement && value) {
            // Para selects HTML nativos con valor específico
            element.focus();
            element.value = value;
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('input', { bubbles: true }));
          }
          break;

        case 'wait':
          // Solo esperar
          break;

        case 'set-image':
          // Establecer URL de imagen directamente llamando al onChange del componente ImageUpload
          // El componente ImageUpload tiene un prop onChange que acepta una URL string
          // El onChange llama a handleChange('imageUrl', url) en ProductCreatePage
          if (value && element) {
            console.log(`[OnboardingTour] Estableciendo imagen: ${value}`);
            
            // Buscar el contenedor ImageUpload
            const imageUploadContainer = element.closest('[data-tour="product-image-upload"]') || element;
            
            // El componente ImageUpload está controlado por el estado del formulario
            // Necesitamos llamar al onChange del componente, que a su vez llama a handleChange('imageUrl', url)
            // Como no tenemos acceso directo al componente React, vamos a usar una aproximación:
            // Disparar eventos en el contenedor que el componente pueda capturar
            
            // Disparar un evento personalizado con la URL
            const imageUrlSetEvent = new CustomEvent('imageUrlSet', {
              bubbles: true,
              cancelable: true,
              detail: { url: value }
            });
            imageUploadContainer.dispatchEvent(imageUrlSetEvent);
            
            // También intentar establecer el valor directamente usando eventos de React
            // Buscar el formulario y disparar eventos que React pueda capturar
            const form = imageUploadContainer.closest('form');
            if (form) {
              // Intentar encontrar el componente ImageUpload y llamar a su onChange directamente
              // Buscar cualquier elemento que pueda tener el valor de imageUrl
              // El componente ImageUpload tiene un prop value que puede ser establecido
              
              // Disparar eventos en el formulario para que React los capture
              const formChangeEvent = new Event('imageUrlChange', { bubbles: true });
              (formChangeEvent as any).detail = { url: value };
              form.dispatchEvent(formChangeEvent);
              
              console.log('[OnboardingTour] Eventos disparados, intentando establecer imagen');
            }
            
            // Nota: El componente ImageUpload necesita escuchar estos eventos para funcionar
            // Por ahora, el paso establecerá la URL si el componente está configurado para escuchar
            // Si no funciona automáticamente, el usuario puede establecer la imagen manualmente
            console.log('[OnboardingTour] ✓ Intento de establecer imagen completado');
          }
          break;
      }

      // Esperar después de la acción
      if (delayAfter > 0) {
        await new Promise(resolve => setTimeout(resolve, delayAfter));
      }
    } catch (error) {
      console.warn('Error ejecutando acción automática:', error);
    }
  }, [goToStep, TOUR_STEPS]);

  // Actualizar elemento objetivo cuando cambia el paso
  // Usar ref para evitar múltiples ejecuciones del mismo paso
  const updatingStepRef = useRef<number>(-1);
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    // Si estamos navegando, no actualizar el elemento todavía
    if (navigatingRef.current) {
      console.log(`[OnboardingTour] Saltando actualización - navegación en progreso`);
      return;
    }

    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    // Limpiar timeout anterior si existe
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }

    console.log(`[OnboardingTour] useEffect: Actualizando elemento para paso ${currentStep}: ${step.id}`);

    // Evitar buscar el mismo paso múltiples veces o si ya se está actualizando este paso específico
    if (updatingStepRef.current === currentStep || isUpdatingElementRef.current) {
      console.log(`[OnboardingTour] Saltando búsqueda - ya se está actualizando paso ${currentStep}`);
      return;
    }
    
    updatingStepRef.current = currentStep;
    lastSearchedStepRef.current = currentStep;
    isUpdatingElementRef.current = true;

    const updateElement = async () => {
      try {
        // Verificar que el DOM esté listo antes de buscar
        console.log(`[OnboardingTour] Verificando DOM antes de buscar: ${step.selector}`);
        // Determinar contenedor según la ruta del paso (para transición, usar productos o clientes)
        const isTransitionStep = step.id === 'transition-to-products' || 
                                 step.id === 'transition-to-customers' ||
                                 step.id === 'transition-to-customer-create';
        let targetRoute = step.route;
        if (isTransitionStep && step.id === 'transition-to-products') {
          targetRoute = '/products/new';
        } else if (isTransitionStep && step.id === 'transition-to-customers') {
          targetRoute = '/customers';
        } else if (isTransitionStep && step.id === 'transition-to-customer-create') {
          targetRoute = '/customers/new';
        }
        const containerSelectors = targetRoute.includes('/sales/') 
          ? ['.sale-create-container']
          : targetRoute === '/products'
          ? ['.products-page-container']
          : targetRoute.includes('/products/')
          ? ['.product-create-container', '.product-detail-container']
          : targetRoute === '/customers'
          ? ['.customers-page-container']
          : targetRoute.includes('/customers/')
          ? ['.customer-create-container', '.customer-detail-container']
          : ['.sale-create-container']; // Por defecto
        const pageHeader = document.querySelector('.page-header');
        
        let container = null;
        for (const selector of containerSelectors) {
          container = document.querySelector(selector);
          if (container) break;
        }
        
        if (!container) {
          console.warn(`[OnboardingTour] ⚠️ Contenedor no encontrado. Esperando...`);
          // Esperar y reintentar
          let retries = 0;
          while (!container && retries < 10) {
            await new Promise(resolve => setTimeout(resolve, 200));
            for (const selector of containerSelectors) {
              container = document.querySelector(selector);
              if (container) break;
            }
            if (container) {
              console.log(`[OnboardingTour] ✓ Contenedor encontrado después de ${retries} reintentos`);
              break;
            }
            retries++;
          }
        } else {
          console.log(`[OnboardingTour] ✓ Contenedor encontrado`);
        }
        
        if (!pageHeader) {
          console.warn(`[OnboardingTour] ⚠️ PageHeader no encontrado`);
        } else {
          console.log(`[OnboardingTour] ✓ PageHeader encontrado`);
        }

        const waitFn = waitForElementRef.current || waitForElement;
        const findFn = findTargetElementRef.current || findTargetElement;
        let element: HTMLElement | null = null;
        
        if (step.waitForElement) {
          console.log(`[OnboardingTour] Esperando elemento con waitForElement: ${step.selector}`);
          element = await waitFn(step.selector, 15000); // Aumentar timeout a 15 segundos
          setTargetElement(element);
          if (!element) {
            // Solo mostrar warning una vez por selector
            const attempts = searchAttemptsRef.current.get(step.selector) || 0;
            if (attempts === 0) {
              console.warn(`[OnboardingTour] ✗ No se encontró el elemento ${step.selector} - el tour continuará sin resaltar elemento`);
              searchAttemptsRef.current.set(step.selector, 1);
            }
          } else {
            console.log(`[OnboardingTour] ✓ Elemento encontrado y establecido como objetivo`);
            searchAttemptsRef.current.delete(step.selector);
          }
        } else {
          // Para elementos sin waitForElement, esperar un poco más antes de buscar
          console.log(`[OnboardingTour] Buscando elemento sin waitForElement: ${step.selector}`);
          await new Promise(resolve => setTimeout(resolve, 500));
          element = findFn(step.selector);
          setTargetElement(element);
          if (!element) {
            // Solo mostrar warning una vez por selector
            const attempts = searchAttemptsRef.current.get(step.selector) || 0;
            if (attempts === 0) {
              console.warn(`[OnboardingTour] ✗ No se encontró el elemento ${step.selector} - el tour continuará sin resaltar elemento`);
              searchAttemptsRef.current.set(step.selector, 1);
            }
          } else {
            console.log(`[OnboardingTour] ✓ Elemento encontrado y establecido como objetivo`);
            searchAttemptsRef.current.delete(step.selector);
          }
        }

        // Ejecutar acción automática si existe y hay elemento
        console.log(`[OnboardingTour] Verificando acción automática:`, {
          hasElement: !!element,
          hasAutoAction: !!step.autoAction,
          autoActionType: step.autoAction?.type,
          autoActionValue: step.autoAction?.value,
        });
        
        if (element && step.autoAction) {
          console.log(`[OnboardingTour] ✓ Ejecutando acción automática: ${step.autoAction.type}${step.autoAction.value ? ` con valor "${step.autoAction.value}"` : ''}`);
          try {
            await executeAutoAction(step, element, currentStep);
            console.log(`[OnboardingTour] ✓ Acción automática completada`);
          } catch (error) {
            console.error(`[OnboardingTour] ✗ Error ejecutando acción automática:`, error);
          }
        } else {
          if (!element) {
            console.log(`[OnboardingTour] ✗ No se puede ejecutar acción automática: elemento no encontrado`);
          }
          if (!step.autoAction) {
            console.log(`[OnboardingTour] ✗ No se puede ejecutar acción automática: no hay autoAction definido`);
          }
        }
      } finally {
        isUpdatingElementRef.current = false;
        // Solo resetear updatingStepRef si todavía estamos en el mismo paso
        if (updatingStepRef.current === currentStep) {
          updatingStepRef.current = -1;
        }
      }
    };

    // Esperar más tiempo para que la página cargue completamente
    // Usar ref para poder limpiarlo si cambia el paso
    updateTimeoutRef.current = setTimeout(updateElement, 1000);
    
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
      isUpdatingElementRef.current = false;
      // Resetear solo si estamos limpiando este paso específico
      if (updatingStepRef.current === currentStep) {
        updatingStepRef.current = -1;
      }
    };
  }, [currentStep, executeAutoAction]); // Remover TOUR_STEPS de las dependencias ya que es estable con useMemo

  // Log cuando cambia currentStep
  useEffect(() => {
    const step = TOUR_STEPS[currentStep];
    console.log(`[OnboardingTour] ⚡ currentStep CAMBIÓ a ${currentStep}:`, {
      id: step?.id,
      title: step?.title,
      route: step?.route,
      autoAdvance: step?.autoAdvance,
      autoAdvanceDelay: step?.autoAdvanceDelay,
    });
  }, [currentStep, TOUR_STEPS]);

  // Memoizar currentStepData para asegurar que cambia cuando cambia currentStep
  const currentStepData = useMemo(() => {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/531533a0-1e0d-46b8-9c26-4e4be3544961',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOnboardingTour.ts:1384',message:'currentStepData useMemo recalculating',data:{currentStep,stepId:TOUR_STEPS[currentStep]?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return TOUR_STEPS[currentStep];
  }, [currentStep, TOUR_STEPS]);
  
  // Escuchar cuando se crea un cliente para capturar su ID
  // IMPORTANTE: Solo ejecutar cuando realmente necesitamos customerId y no lo tenemos aún
  // Y solo cuando el tour ya está iniciado y avanzado (currentStep > 0)
  useEffect(() => {
    // No ejecutar si el tour no ha iniciado aún o está en el paso inicial
    if (!isTourStarted || currentStep === 0) {
      return;
    }
    
    // Si estamos en un paso que necesita customerId y acabamos de crear un cliente
    // (el último cliente del contexto es nuevo), capturar su ID
    const needsCustomerId = currentStepData?.route?.includes('/customers/:id') || 
                           currentStepData?.id === 'transition-to-customer-detail' ||
                           currentStepData?.id?.startsWith('customer-detail');
    
    // Solo procesar si realmente necesitamos customerId, no lo tenemos aún, y hay clientes disponibles
    if (needsCustomerId && !selectedCustomerIdRef.current && customers.length > 0) {
      // Usar el primer cliente del contexto (que debería ser el más reciente)
      const latestCustomer = customers[0];
      if (latestCustomer?.id) {
        console.log(`[OnboardingTour] 🎯 Cliente creado detectado - capturando ID: ${latestCustomer.id}`);
        selectedCustomerIdRef.current = latestCustomer.id;
        setSelectedCustomerId(latestCustomer.id);
        
        // Actualizar rutas dinámicas de pasos siguientes
        // Usar TOUR_STEPS_PHASE1 directamente para evitar problemas con el useMemo
        const currentStepIndex = currentStep;
        if (currentStepIndex >= 0 && currentStepIndex < TOUR_STEPS_PHASE1.length) {
          let updatedStepsCount = 0;
          for (let i = currentStepIndex + 1; i < TOUR_STEPS_PHASE1.length; i++) {
            const nextStep = TOUR_STEPS_PHASE1[i];
            
            if (nextStep.id === 'transition-to-customer-detail') {
              nextStep.route = `/customers/${latestCustomer.id}`;
              updatedStepsCount++;
            }
            if (nextStep.route === '/customers/:id' || nextStep.route.includes('/customers/:id')) {
              nextStep.route = `/customers/${latestCustomer.id}`;
              updatedStepsCount++;
            }
          }
          console.log(`[OnboardingTour] ✅ Rutas actualizadas: ${updatedStepsCount} pasos modificados con ID ${latestCustomer.id}`);
        }
      }
    }
  }, [customers, currentStepData, currentStep, isTourStarted]); // Agregar isTourStarted para evitar ejecución temprana

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7246/ingest/531533a0-1e0d-46b8-9c26-4e4be3544961',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOnboardingTour.ts:1390',message:'currentStep changed in hook',data:{currentStep,stepId:currentStepData?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  }, [currentStep, currentStepData]);
  // #endregion

  // Memoizar el objeto de retorno para que React detecte cambios cuando currentStep cambia
  // Esto asegura que los componentes que usan el hook se re-rendericen cuando currentStep cambia
  const returnValue = useMemo(() => {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/531533a0-1e0d-46b8-9c26-4e4be3544961',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOnboardingTour.ts:1450',message:'Creating return value object',data:{currentStep},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return {
      currentStep,
      totalSteps: TOUR_STEPS.length,
      currentStepData,
      targetElement,
      isLoading,
      demoData: demoData || null,
      selectedProductId: selectedProductIdRef.current || selectedProductId,
      selectedCustomerId: selectedCustomerIdRef.current || selectedCustomerId,
      startTour,
      nextStep,
      previousStep,
      skipTour,
      completeTour,
      goToStep,
      isTourStarted,
      executePendingProductClick: () => {
        console.log('[OnboardingTour] 🎯 executePendingProductClick llamado', {
          hasPendingElement: !!pendingProductClickRef.current,
          hasSelectedId: !!selectedProductIdRef.current,
          selectedIdValue: selectedProductIdRef.current,
          elementDataTour: pendingProductClickRef.current?.getAttribute('data-tour'),
          productsAvailable: products.length,
          firstProductId: products.length > 0 ? products[0]?.id : null
        });
        
        // Usar el primer producto del contexto en lugar del seleccionado
        let productId: string | null = null;
        
        if (products.length > 0 && products[0]?.id) {
          productId = products[0].id;
          console.log('[OnboardingTour] ✅ Usando primer producto del contexto', {
            productId: productId,
            productName: products[0].name,
            totalProducts: products.length,
            selectedId: selectedProductIdRef.current,
            usingSelectedId: false
          });
        } else if (selectedProductIdRef.current) {
          // Fallback al ID seleccionado si no hay productos en el contexto
          productId = selectedProductIdRef.current;
          console.log('[OnboardingTour] ⚠️ No hay productos en contexto, usando ID seleccionado como fallback', {
            productId: productId
          });
        } else {
          console.error('[OnboardingTour] ❌ No se puede ejecutar click pendiente - no hay productos disponibles ni ID seleccionado', {
            productsLength: products.length,
            hasSelectedId: !!selectedProductIdRef.current
          });
          return;
        }
        
        if (productId) {
          console.log('[OnboardingTour] ✅ Ejecutando click pendiente en producto', {
            productId: productId,
            productIdType: typeof productId,
            productIdLength: productId.length,
            elementDataTour: pendingProductClickRef.current?.getAttribute('data-tour'),
            source: 'context-first-product'
          });
          
          // NO navegar usando React Router cuando estamos en el tour
          // El TourPageRenderer se encarga del renderizado usando MemoryRouter
          // Solo asegurarnos de que el ID esté disponible en el estado
          if (selectedProductIdRef.current !== productId) {
            selectedProductIdRef.current = productId;
            setSelectedProductId(productId);
            console.log('[OnboardingTour] ✅ ID del producto actualizado en el estado (sin navegar)');
          }
          
          // Limpiar referencia pendiente ya que usamos el primer producto del contexto
          pendingProductClickRef.current = null;
          console.log('[OnboardingTour] ✅ Click pendiente procesado - TourPageRenderer manejará el renderizado');
        }
      },
    };
  }, [currentStep, currentStepData, targetElement, isLoading, demoData, selectedProductId, selectedCustomerId, startTour, nextStep, previousStep, skipTour, completeTour, goToStep, isTourStarted, navigate, products, TOUR_STEPS.length]);
  
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/531533a0-1e0d-46b8-9c26-4e4be3544961',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOnboardingTour.ts:1468',message:'Hook returning value',data:{currentStep,returnValueRef:returnValue.currentStep},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  
  return returnValue;
}
