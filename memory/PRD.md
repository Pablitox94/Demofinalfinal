# EstadísticaMente - PRD (Product Requirements Document)

## Descripción General
EstadísticaMente es una aplicación web educativa de estadística para enseñar pensamiento estadístico y análisis de datos en tres niveles educativos: Primario, Secundario y Superior.

**Idioma**: Español (Argentina)  
**Stack Técnico**: React (Frontend) + FastAPI (Backend) + MongoDB + DeepSeek/OpenAI API via Emergent LLM Key

---

## Estado del Proyecto (28 Enero 2025)

### ✅ NIVEL PRIMARIO - COMPLETADO (Bugs corregidos 28/01/2025)
- Dashboard con interfaz colorida (rosa/fucsia) adaptada para niños 6-12 años
- Misiones (proyectos) con creación, edición y eliminación
- **Carga de datos**:
  - Manual (datos sueltos)
  - Tabla de frecuencia
  - **Por Voz** ✅ (Web Speech API - CORREGIDO)
- Gráficos simples: barras, sectores, pictogramas con emojis
- Análisis básico con medidas de tendencia central
- Reportes IA con lenguaje infantil
- Chatbot "Profe Marce" adaptado para niños
- Juegos educativos interactivos
- **Exportación a PDF con Reporte de IA** ✅ (CORREGIDO)
- **Sistema de Logros dinámico** ✅ (CORREGIDO)
  - 15 logros desbloqueables
  - 5 insignias especiales
  - Tracking de actividad: misiones, gráficos, análisis, juegos, preguntas, reportes
  - Botones Actualizar y Reiniciar
  - Persistencia en localStorage

### ✅ NIVEL SECUNDARIO - COMPLETADO
- Dashboard con interfaz profesional (púrpura/violeta) para estudiantes 13-17 años
- Proyectos de ejemplo: Mundial 2026, Edades de Estudiantes, Horas vs Calificaciones
- Carga de datos: manual, tabla de frecuencia, voz, archivo Excel/CSV
- Dashboard de Gráficos (estilo PowerBI) con filtros cruzados
- Análisis: tablas de frecuencia, medidas de tendencia central, dispersión, orden
- Reportes IA y Profe Marce para adolescentes
- Exportación PDF y JSON

### ✅ NIVEL SUPERIOR/UNIVERSITARIO - COMPLETADO (28/01/2025)
- Dashboard profesional (esmeralda/teal/cyan) para universitarios
- 4 Proyectos de ejemplo con datasets multivariados (40 registros c/u)
- Análisis Avanzado: regresión lineal, correlación, intervalos de confianza, pruebas de hipótesis, test de normalidad
- 5 Actividades Interactivas: CLT, hipótesis, regresión, correlación, intervalos
- Reportes IA académicos con LaTeX
- Profe Marce con lenguaje académico formal

### 🔲 AUTENTICACIÓN - PENDIENTE
- Login con email/password
- Roles: Estudiante, Docente, Administrador
- Firebase Authentication

---

## Bugs Corregidos (28/01/2025 - Nivel Primario)

| Bug | Descripción | Solución |
|-----|-------------|----------|
| PDF sin reporte IA | El PDF no incluía el análisis de Profe Marce | Agregado botón "Generar Reporte IA" en Descargar.js con vista previa y inclusión en PDF |
| Carga por voz deshabilitada | Pestaña de voz mostraba "próximamente" | Implementada UI completa con Web Speech API, botón micrófono, y área de transcripción |
| Logros estáticos | Números no se movían ni reseteaban | Reescrito Logros.js con sistema dinámico usando localStorage y achievementTracker.js |

---

## Arquitectura de Código

```
/app/
├── backend/
│   ├── server.py
│   ├── deepseek_service.py
│   └── tests/
│
├── frontend/src/
│   ├── App.js
│   ├── utils/
│   │   └── achievementTracker.js  # NEW - Tracking de logros
│   ├── components/
│   └── pages/
│       ├── Logros.js              # UPDATED - Sistema dinámico
│       ├── Descargar.js           # UPDATED - Reporte IA + PDF
│       ├── CargaDatosPrimaria.js  # UPDATED - Voz funcional
│       └── ...
│
└── test_reports/
    ├── iteration_1.json (Secundario)
    ├── iteration_2.json (Superior)
    └── iteration_3.json (Bugs Primario - 100% PASS)
```

---

## Próximos Pasos (Backlog)

### P2 - Media Prioridad
- Implementar autenticación real con Firebase
- Sistema de roles (Estudiante/Docente/Admin)
- Dashboard para profesores/administradores
- Persistir logros en backend (actualmente localStorage)

### P3 - Baja Prioridad
- Optimización de rendimiento
- Tests unitarios adicionales
- Refactorización de Sidebars en componente único

---

## MOCKED
- **Autenticación**: Usuario demo (estudiante@estadisticamente.com)
- **Logros**: Persistidos en localStorage, no en backend
