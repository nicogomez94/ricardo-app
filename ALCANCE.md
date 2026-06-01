# Etapa 1: Version Comercial Inicial

Esta etapa corresponde a la primera version vendible del sistema, con foco en un editor funcional y presentable para mostrar a clientes y validar uso real.

## Objetivo
Contar con una herramienta de edicion de disenos textiles que permita crear propuestas visuales rapidamente y exportarlas en PNG.

## Funcionalidades incluidas

### 1. Editor visual de diseno
- Canvas principal de previsualizacion.
- Actualizacion en tiempo real ante cualquier cambio.
- Interfaz con galeria de efectos y panel de controles.

### 2. Efectos visuales prearmados
- Seleccion de efectos con un click.
- Previsualizacion de cada efecto en miniaturas.
- Aplicacion del efecto seleccionado sobre texto o imagen.
- Cada efecto funciona como un filtro visual predefinido aplicado al contenido activo del canvas.
- El filtro modifica la apariencia del contenido, pero no convierte el diseno en una pieza editable capa por capa.

Efectos disponibles en esta etapa:
1. Rhinestone
2. Embroidery
3. Chenille
4. Puff Print
5. Varsity
6. Vintage
7. PVC / Rubber
8. Leather Patch

#### Alcance de aplicacion de filtros
Aplicar un filtro en esta etapa implica tomar el contenido activo del editor, ya sea texto o imagen cargada por el usuario, y renderizarlo con una estetica visual determinada. El resultado se muestra en el canvas principal y se actualiza cuando el usuario cambia el texto, la fuente, el tamano, los colores disponibles o la imagen de origen.

Los filtros incluidos son efectos cerrados y prearmados. Esto significa que cada filtro tiene una logica visual definida para simular una terminacion o tecnica textil especifica, como bordado, rhinestone, chenille, puff print o leather patch. El usuario puede elegir el filtro y modificar los parametros expuestos en la interfaz, pero no editar internamente la construccion tecnica del efecto.

En terminos practicos, aplicar un filtro incluye:
- Cambiar la apariencia visual del texto o imagen segun el efecto seleccionado.
- Recalcular la previsualizacion en tiempo real al modificar parametros disponibles.
- Mantener una unica pieza visual final dentro del canvas.
- Exportar el resultado renderizado como imagen PNG.

Aplicar un filtro no incluye en esta etapa:
- Separar automaticamente el resultado en capas editables independientes.
- Editar manualmente puntadas, piedras, costuras, relieve, bordes, sombras o texturas internas del efecto.
- Convertir el resultado en un archivo tecnico de produccion para bordado, corte, sublimacion, impresion, serigrafia o maquinaria industrial.
- Generar matrices, moldes, patrones, archivos vectoriales editables o instrucciones de fabricacion.
- Aplicar multiples filtros combinados sobre el mismo objeto como una cadena editable de efectos.
- Ajustar perspectiva, deformacion libre, mascara avanzada, recorte inteligente o trazado manual del contenido.
- Garantizar equivalencia fisica exacta con materiales reales; el objetivo es una simulacion visual para propuesta comercial.

#### Limites tecnicos y comerciales de los filtros
Los filtros estan pensados para generar una representacion visual rapida y convincente dentro del editor. Su alcance principal es permitir al usuario crear una propuesta grafica presentable para revision, venta o validacion con cliente.

La calidad final del resultado depende del contenido ingresado. En texto, depende de la fuente, tamano y cantidad de caracteres. En imagen, depende de la resolucion, contraste, transparencia y limpieza del archivo cargado. Imagenes de baja calidad, con fondos complejos o con detalles muy pequenos pueden producir resultados menos precisos.

Los filtros no reemplazan la intervencion de un disenador, bordador, estampador o proveedor tecnico cuando se requiera produccion fisica. Para fabricacion real puede ser necesario reinterpretar el diseno, ajustar proporciones, reducir detalles, separar colores, preparar archivos tecnicos o validar materiales y medidas con el proveedor correspondiente.

### 3. Edicion de texto
- Campo para escribir el texto del diseno (hasta 30 caracteres).
- Selector de fuente.
- Control de tamano de tipografia.

Fuentes disponibles en esta etapa:
1. Impact
2. Arial Black
3. Georgia
4. Verdana
5. Trebuchet MS
6. Courier New
7. Times New Roman

### 4. Edicion de colores
- Selectores de color segun el efecto activo.
- Ajuste de color en tiempo real sobre el diseno.

### 5. Carga de imagen del usuario
- Carga desde explorador de archivos.
- Drag and drop.
- Vista previa y datos basicos de la imagen.
- Boton para quitar imagen y volver a modo texto.

Formatos soportados:
1. PNG
2. JPG/JPEG
3. GIF
4. WEBP
5. SVG

### 6. Modo imagen
- Cuando hay imagen cargada, el efecto se aplica sobre la imagen.
- Se desactivan controles de texto para evitar conflictos de edicion.

### 7. Exportacion del diseno
- Descarga del resultado final en PNG.
- Exportacion en alta calidad (pixelRatio 2).
- Nombre de archivo automatico:
1. [efecto]-[texto].png
2. [efecto]-diseno.png (si no hay texto)

### 8. Arma tu pliego (DTF)

Herramienta para armar un pliego de impresion DTF estandar con las imagenes y disenos generados en el editor.

**¿Que es un pliego DTF?**
El DTF (Direct to Film) es una tecnica de estampado donde los disenos se imprimen sobre una lamina especial y luego se transfieren a prendas mediante calor. El pliego es la lamina sobre la que se colocan los disenos antes de enviarlos a imprimir.

**Dimensiones del pliego:**
- Ancho: 58 cm
- Alto: 1 metro
- Fondo: transparente

**Funcionalidades incluidas:**

- Visualizacion del pliego en pantalla con fondo negro para verificar el resultado.
- El usuario puede colocar en el pliego las imagenes que trabajo en los efectos del editor.
- Reduccion automatica de 1 pixel por bordes al subir cada imagen al pliego, para eliminar el pixel de transparencia semitransparente que puede quedar en los bordes del diseno.
- El fondo negro del pliego permite identificar visualmente si hay transparencias parciales o semitransparencias no deseadas en los disenos colocados.
- Exportacion del pliego completo como imagen PNG.

**Por que se reduce 1 pixel:**
Al generar disenos con efectos y transparencia, puede quedar un pixel semitransparente en el borde del recorte. Ese pixel es invisible sobre fondos claros pero visible al imprimir. La reduccion automatica de 1 pixel elimina ese borde antes de enviar a produccion.

**Aclaracion:** El pliego es una herramienta de armado visual orientada a propuesta y preparacion de archivos para DTF. No garantiza la equivalencia exacta con los requisitos tecnicos del proveedor de impresion. El usuario debe validar dimensiones, colores y preparacion final con su proveedor antes de enviar a produccion.

### 9. Creacion y alta de usuario
- Pantalla o flujo de registro para crear un nuevo usuario.
- Alta de usuario con los datos necesarios para identificarlo dentro del sistema.
- Inicio de sesion para acceder al editor.
- Validaciones basicas de campos obligatorios.
- Persistencia de la informacion necesaria para mantener el acceso del usuario.

#### Alcance de la gestion de usuarios
En esta etapa, la gestion de usuarios esta orientada a permitir el acceso individual al sistema y habilitar el uso del editor bajo una cuenta creada. El objetivo es que un usuario pueda darse de alta, ingresar al sistema y utilizar las funcionalidades principales incluidas en esta version comercial inicial.

El alta de usuario incluye la creacion del registro, la validacion basica de datos requeridos y el acceso posterior al editor mediante inicio de sesion. No implica, en esta etapa, una administracion avanzada de cuentas, permisos o estructuras organizacionales complejas.
