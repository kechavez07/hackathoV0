# 🚀 TrustPay - Solución de Pagos Seguros con Blockchain

## 📌 Resumen del Proyecto
TrustPay es una innovadora pasarela de pagos que utiliza tecnología blockchain para garantizar transacciones seguras y confiables en servicios de entrega. Nuestra solución aborda el problema crítico de confianza entre clientes y repartidores, reduciendo significativamente los fraudes y disputas.

## 🔍 Problemática Actual
Las principales plataformas de delivery enfrentan graves problemas de confianza:
- Hasta un 95% de calificaciones negativas en plataformas como Glovo y Rappi
- Problemas comunes:
  - Robo de comida
  - Entregas incompletas
  - Productos en mal estado
  - Traspaso de responsabilidades
  - Falta de transparencia en las transacciones

## 🎯 Objetivos
- Reducir fraudes en un 80-90%
- Mejorar la confianza mediante registros inmutables
- Implementar una solución escalable usando tecnología blockchain
- Proporcionar pruebas inalterables de entrega

## 🛠️ Tecnologías Clave
- **Frontend**: Next.js con TypeScript
- **Backend**: Node.js con Express
- **Blockchain**: Lisk SDK
- **Billeteras**: Web3 (MetaMask, etc.)
- **Autenticación**: JWT + Web3
- **Base de Datos**: MongoDB

## 📱 Flujo del Usuario
1. **Inicio de Pedido**
   - Cliente realiza pedido en la app de delivery
   - Selecciona método de pago (cripto, tarjeta, etc.)
   - El pago se retiene en garantía

2. **Proceso de Entrega**
   - Repartidor genera un QR único al llegar
   - Cliente escanea el QR con su wallet Web3
   - Ambas partes firman digitalmente la transacción

3. **Confirmación**
   - Pago se libera automáticamente tras firma
   - Transacción se registra en blockchain
   - Se genera comprobante digital de entrega

## 🏗️ Estructura del Proyecto
```
TrustPay/
├── Frontend/           # Aplicación Next.js
├── Backend/            # Servidor Node.js
│   ├── src/
│   │   ├── controllers/  # Lógica de negocio
│   │   ├── middleware/   # Autenticación y validación
│   │   ├── models/       # Modelos de datos
│   │   ├── services/     # Servicios de negocio
│   │   ├── contracts/    # Smart Contracts
│   │   └── routes/       # Rutas de la API
│   └── config/          # Configuraciones
└── docs/               # Documentación
```

## 🚀 Características Principales
- **Firmas Digitales**: Verificación de identidad mediante blockchain
- **Escrow Inteligente**: Fondos retenidos hasta confirmación de entrega
- **Sistema de Reputación**: Basado en blockchain para mayor transparencia
- **Resolución de Disputas**: Proceso automatizado con pruebas inmutables
- **Bajo Costo**: Uso de soluciones L2 para minimizar comisiones

## 📚 Documentación Técnica
Consulte [API_DOCUMENTATION_V2.md](API_DOCUMENTATION_V2.md) para la documentación detallada de la API.

## 🛠️ Instalación
1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   cd Backend
   npm install
   cd ../Frontend
   npm install
   ```
3. Configurar variables de entorno (ver .env.example)
4. Iniciar servidores:
   ```bash
   # En Backend/
   npm run dev
   # En Frontend/
   npm run dev
   ```


## 🤝 Contribución
¡Las contribuciones son bienvenidas! Por favor lea nuestra guía de contribución antes de enviar un PR.

## 📄 Licencia
Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más información.

---
Desarrollado con ❤️ por el equipo de TrustPay
