# Demo board for the listing screenshots

Never take listing screenshots on a real board. Build this one instead: the
directory is public and a real board leaks client names, and a five-card board
argues against the product the description is selling.

Keep this file. If a review round asks for new screenshots, the same board can
be rebuilt in minutes instead of improvised differently.

## How to load it fast

Trello creates **one card per line** when several lines are pasted into the
"add a card" box. Paste each block below into its list and accept the prompt.
Fifty cards in about two minutes.

## Lists

Create these five, in this order:

```
Backlog
Por hacer
En progreso
En revisión
Terminado
```

Plus `Bloqueado` if a sixth column is wanted — the three cards for it are below.

## Backlog (18)

```
Rediseñar la landing de producto
Migrar la base de datos a Postgres 16
Auditoría de accesibilidad WCAG 2.2
Reemplazar la librería de gráficos
Documentar la API pública
Modo oscuro en el panel de administración
Exportar reportes a CSV
Búsqueda global con autocompletado
Limpiar dependencias sin usar
Unificar los estilos de botones
Inicio de sesión con Google
Historial de cambios por registro
Reducir el tamaño del bundle inicial
Notificaciones push en el móvil
Plantillas de email transaccional
Paginación en el listado de clientes
Revisar los textos de error
Tablero de métricas para soporte
```

## Por hacer (10)

```
Integrar la pasarela de pagos
Configurar alertas de uptime
Automatizar el backup semanal
Validación de RUC en el alta de clientes
Filtros guardados por usuario
Migrar los cron jobs al servidor nuevo
Rate limiting en los endpoints públicos
Onboarding para el equipo nuevo
Actualizar la política de privacidad
Importar clientes desde planilla
```

## En progreso (7)

```
Optimizar las consultas del dashboard
Corregir el bug de zona horaria en reportes
Refactor del módulo de facturación
Subida de archivos adjuntos
Permisos por rol en el panel
Pruebas end to end del checkout
Cache de resultados de búsqueda
```

## En revisión (6)

```
Formulario de alta de proveedores
Corrección del cálculo de impuestos
Nuevo diseño de la barra lateral
Registro de auditoría de sesiones
Ajuste de márgenes en la impresión
Validar vencimientos en el carrito
```

## Bloqueado (3)

```
Esperando credenciales del banco
Certificado SSL del subdominio nuevo
Aprobación legal de los términos
```

## Terminado (6)

```
Migración del servidor de correo
Cambio de logo en toda la app
Corrección de acentos en los PDF
Alta de usuarios por lote
Ajuste del contraste en modo claro
Retiro del endpoint v1 obsoleto
```

## Dress the board before shooting

The cards alone are not enough — the columns have to look inhabited.

**Labels.** Five is plenty, and the palette matters because the table renders
Trello's own colors:

| Label | Color | Roughly how many |
| --- | --- | --- |
| urgente | red | 5 |
| bloqueante | orange | 4 |
| mejora | green | 12 |
| técnico | blue | 10 |
| diseño | purple | 6 |

Leave about a third of the cards with no label at all. A column where every row
is full reads as fake.

**Due dates.** Spread them across two months, and put **4 or 5 in the past** so
the overdue highlight has something to show. Mark one or two past-due cards as
complete: that proves overdue and complete are not the same thing, which is a
real behaviour worth showing.

**Members.** Assign 3 or 4 different people, and leave some cards unassigned.
Every row showing the same name is the clearest sign of a staged board.

## Shot list

| # | Shot | Must be visible |
| --- | --- | --- |
| 1 | Grouped by list, several sections | The per-list count badges |
| 2 | Flat table sorted by due date | An overdue row in red, sort arrow on the header |
| 3 | Columns menu open | Position it so it does **not** cover the table |
| 4 | Filter typed | The counter, reading something like `6 de 50 tarjetas` |
| 5 | GIF: type, pause, clear, sort, sort again | The `N°` column staying 1..n while rows reorder |

Crop to the modal. Do not include the sliver of Trello chrome above it.
