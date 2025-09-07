#Descripción del Proyecto
Este proyecto combina la potencia de Google Apps Script con un frontend moderno construido en React, potenciado por Vite.js para un desarrollo ágil y eficiente. Se utiliza Tailwind CSS como framework de estilos para lograr un diseño altamente personalizable y responsivo, mientras que Shadcn/UI aporta componentes reutilizables y accesibles que permiten crear interfaces elegantes y consistentes.

La integración con Google Apps Script facilita la automatización de flujos de trabajo, conexión con servicios de Google Workspace (Sheets, Docs, Drive, Gmail, etc.) y despliegue de aplicaciones internas sin necesidad de infraestructura adicional. Por su parte, el stack de frontend asegura una experiencia de usuario moderna, rápida y escalable.

# COMO EJECUTAR EL PROYECTO

1. Clona el repositorio en tu máquina local.
2. Navega al directorio del proyecto:
   ```bash
   cd appscript-react
   ```
3. Instala las dependencias del proyecto:
   ```bash
    npm install
   ```
4. instala clasp globalmente si no lo tienes instalado
   ```bash
    npm install -g clasp
   ```
5. Autentica clasp con tu cuenta de Google:
   ```bash
    clasp login
   ```
6. Crea un nuevo proyecto de Google Apps Script o usa uno existente y obtén su ID.
7. Configura clasp para vincularlo con tu proyecto de Google Apps Script:
   ```bash
   clasp create --type standalone --title "Nombre de tu Proyecto" --rootDir ./server
   ```
   O si ya tienes un proyecto existente:
   ```bash
   clasp clone <PROJECT_ID>
   ```
