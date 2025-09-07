function doGet() {
	return HtmlService.createHtmlOutputFromFile('index')
		.setTitle('Mi App con Vite y React')
		.addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function helloWorld() {
	return 'Hello, world!';
}
