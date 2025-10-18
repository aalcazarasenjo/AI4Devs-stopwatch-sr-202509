Prompt
-----------------------------------------------
#Rol 
Actúa como Desarrollador Frontend Senior experto en JavaScript y HTML5. 

#Objetivo 
El objetivo es desarrollar un cronómetro y una cuenta regresiva, con capacidad de gestionar múltiples instancias simultáneas. Para ello es necesario completar los archivos Script.js e Index HTML 

#Contexto 
Me encuentro realizando un master de desarrollo impulsado con IA y debemos de realizar este ejercicio a partir de un repositorio base con dos archivos, que se deben completar con código: Archivos base: - 1. Script.js(Vacío) - 2. Index HTML el cual tiene la siguiente estructura: <!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <title>Timer and Countdown</title> <link rel="stylesheet" href="styles.css"> </head> <body> <h1>Timer and Countdown</h1> <script src="script.js"></script> </body> </html> 

#Requisitos
 La UI debe replicar fielmente las dos imágenes de referencia que proporciono. Genera un botón de añadir cuenta atrás o cronómetro Genera un botón de iniciar y reiniciar. Habilita función de que se puedan eliminar por separado. Al finalizar cualquier cuenta regresiva, muestra una notificación del navegador y reproduce un sonido de alerta. 

#Ejemplos Puede visitar un ejemplo de contador en la página web: https://www.online-stopwatch.com, que coincide además con el diseño de las imágenes que adjunto.

-----------------------------------------------

He usado esta técnica donde se exponen: Rol, Objetivo, COntexto, Requisitos y especificaciones y ejemplo de cronómetro asociado a una página Web. Básicamente se utiliza esta regla para utilizar de manera eficiente la IA. Acorde al ejercicio he decidido realizar una sección específica de los requisitos además de adjuntar una imagen para que diseñe lo más parecido posible al ejemplo dado dicho cronómetro/cuenta atrás.

En base a las incidencias que he visto le planteo el segundo prompt

Prompt 2

Eres un ingeniero de software senior. Revisa el código anterior, elabora un listado de dudas y preguntas en base a posibles incidencias que describo a continuación y una vez te conteste a las preguntas (Espera mi respuesta) generaremos el código definitivo para solucionarlas: 1. Se observa que el tamaño de los números del tiempo excede el tamaño de la caja que lo debe contener. 2. Cuando se añade el cronómetro se añade la cuenta atrás y viceversa (Están intercambiados) 3. El formato de tiempo a introducir no es user friendly, debería quedarse un formato fijo sin posibilidad de dejar abierto el formato.

Prompt 3

1. Los números deben encajar dentro del margen como en la referencia. Los milisegundos deben mantenerse tal y como están. Me vale la fuente actual
2. Por defecto que aparezca 00:01:00
3.Si siempre HH:MM:SS Si el usuario introduce 75 en minutos normaliza a 01:15:00

Extras. Beep en un patrón de 3. Si el botón Start debe alternar Start / Pause / Resume

Prompt 4

Ha perdido todo el formato de la primera instrucción

Prompt 5
Manteniéndo todo el formato actual. Solo cambia a nivel de funcionalidad:

1. Cuando se pulsa en "Pause" no pausa. Haz que pause.
2. El formato de introducción del tiempo cuenta atrás sigue sin ser práctico. Debe actualizarse el número de la derecha del cursor en la caja de introducción del tiempo  a configurar en la cuenta atrás.

