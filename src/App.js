
import {
	PerspectiveCamera,
	Vector3,
	Color,
	BoxGeometry,
	Mesh,
	Clock,
	MeshLambertMaterial,
	DirectionalLight,
	Scene,
	WebGLRenderer,
	sRGBEncoding,
	Float32BufferAttribute
} from 'three';

import { ADDITION, SUBTRACTION, INTERSECTION, Brush, Evaluator } from 'three-bvh-csg';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

let
camera,
clock,
controls,
renderer,
scene,
operation,
doCut,
inputFiles,
currentBrush,
currentSecondBrush,
evaluator,
addMeshButton,
subtractMeshButton ,
intersectMeshButton,
cutMeshButton,
saveMeshButton,
bellAudio;

function initApp() {

	evaluator = new Evaluator();

	camera = new PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.05, 10000 );
	camera.position.set( 75, 100, 200 );

	renderer = new WebGLRenderer( { antialias: true } );

	renderer.physicallyCorrectLights = true;
	renderer.outputEncoding = sRGBEncoding;
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	clock = new Clock();

	scene = new Scene();
	scene.background = new Color( 0x4f6fff );

	const light = new DirectionalLight( );
	light.position.set( 1, 2, 1.45 );
	scene.add( light );

	const light2 = new DirectionalLight( 0xFFFFFF, 0.7 );
	light2.position.set( - 3, - 1.5, - 2 );
	scene.add( light2 );

	controls = new OrbitControls( camera, renderer.domElement );

	window.addEventListener( 'resize', onWindowResize, false );

	inputFiles = document.createElement( 'input' );
	inputFiles.type = "file";
	inputFiles.onchange = onFilesLoaded;

	const contentDiv = document.createElement( 'div' );
	contentDiv.innerHTML = '<a href="https://github.com/yomboprime/Yombool">Yombool home page: Go here.</a><br/>Bell sound by InspectorJ, Creative Commons Attribution 4.0';
	contentDiv.style.position = "absolute";
	contentDiv.style.top = "0px";
	contentDiv.style.left = "0px";
	contentDiv.style.color = "white";
	contentDiv.style.backgroundColor = "black";
	contentDiv.style.opacity = "0.5";
	document.body.appendChild( contentDiv );

	const finalDiv = document.createElement( 'div' );
	finalDiv.style.width = "100%";

	addMeshButton = document.createElement( 'button' );
	addMeshButton.innerHTML = "Add (union) a STL mesh...";
	finalDiv.appendChild( addMeshButton );

	subtractMeshButton = document.createElement( 'button' );
	subtractMeshButton.innerHTML = "Subtract a STL mesh...";
	subtractMeshButton.disabled = true;
	finalDiv.appendChild( subtractMeshButton );

	intersectMeshButton = document.createElement( 'button' );
	intersectMeshButton.innerHTML = "Intersect a STL mesh...";
	intersectMeshButton.disabled = true;
	finalDiv.appendChild( intersectMeshButton );

	cutMeshButton = document.createElement( 'button' );
	cutMeshButton.innerHTML = "Cut with a STL mesh...";
	cutMeshButton.disabled = true;
	finalDiv.appendChild( cutMeshButton );

	saveMeshButton = document.createElement( 'button' );
	saveMeshButton.innerHTML = "Save result to STL...";
	saveMeshButton.disabled = true;
	finalDiv.appendChild( saveMeshButton );

	contentDiv.appendChild( finalDiv );

	addMeshButton.onclick = () => { newMesh( ADDITION ); };
	subtractMeshButton.onclick = () => { newMesh( SUBTRACTION ); };
	intersectMeshButton.onclick = () => { newMesh( INTERSECTION ); };
	cutMeshButton.onclick = () => { newMesh( SUBTRACTION, true ); };
	saveMeshButton.onclick = saveSTL;

	onWindowResize();
	animate();

};

function newMaterial() {

	return new MeshLambertMaterial( { color: Math.floor( Math.random() * 0xFFFFFF ) } );

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

	//const deltaTime = app.clock.getDelta();

	requestAnimationFrame( animate );

	renderer.render( scene, camera );

}

function newMesh( op, cut ) {

	if ( ! bellAudio ) bellAudio = new Audio( 'bell.ogg' );

	operation = op;
	doCut = cut === true;
	inputFiles.click();

}

function onFilesLoaded( event ) {

	const files = event.target.files;

	if ( ! files || files.length === 0 ) return;

	addMeshButton.disabled = true;
	subtractMeshButton.disabled = true;
	intersectMeshButton.disabled = true;
	cutMeshButton.disabled = true;
	saveMeshButton.disabled = true;

	const file = files[ 0 ];

	const reader = new FileReader();

	reader.onload = ( e ) => {

		const fileContents = e.target.result;

		parseSTLFile( fileContents, file.name );

	}

	reader.onerror = function( e ) {

		alert( "Error loading file " + file.name );

	};

	reader.readAsArrayBuffer( file );

}

function parseSTLFile( fileContents, fileName ) {

	const geometry = new STLLoader().parse( fileContents );
	if ( ! geometry ) {

		alert( "Error parsing file " + fileName );
		return;

	}

	if ( ! geometry.getAttribute( 'uv' ) ) {

		const numVertices = Math.floor( geometry.getAttribute( 'position' ).array.length / 3 );
		const uvs = [];
		for ( let i = 0; i < 2 * numVertices; i ++ ) uvs.push( 0.0 );
		geometry.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

	}

	performOperation( operation, doCut, geometry );

}

function performOperation( operation, doCut, geometry ) {

	let doNotify = true;

	const newBrush = new Brush( geometry, newMaterial() );

	let newCurrentBrush = null;

	if ( currentBrush ) {

		scene.remove( currentBrush );

		newCurrentBrush = evaluator.evaluate( currentBrush, newBrush, operation );

	}
	else {

		newCurrentBrush = newBrush;
		doNotify = false;

	}

	scene.add( newCurrentBrush );

	if ( currentSecondBrush ) scene.remove( currentSecondBrush );

	if ( doCut ) {

		currentBrush.material = newMaterial();
		currentSecondBrush = evaluator.evaluate( currentBrush, newBrush, INTERSECTION );
		scene.add( currentSecondBrush );

	}
	else currentSecondBrush = null;

	currentBrush = newCurrentBrush;

	addMeshButton.disabled = false;
	subtractMeshButton.disabled = false;
	intersectMeshButton.disabled = false;
	cutMeshButton.disabled = false;
	saveMeshButton.disabled = false;

	if ( doNotify ) {

		bellAudio.play();
		alert( "Operation done." );

	}

}

function saveSTL() {

	if ( ! currentBrush ) return;

	const exporter = new STLExporter();
	const data = exporter.parse( currentBrush, { binary: true } );

	if ( currentSecondBrush ) {

		const data2 = exporter.parse( currentSecondBrush, { binary: true } );
		saveFile( "output_part_2.stl", new Blob( [ data2 ], { type: "model/stl" } ) );
		scene.remove( currentSecondBrush );
		currentSecondBrush = null;

		saveFile( "output_part_1.stl", new Blob( [ data ], { type: "model/stl" } ) );

	}
	else saveFile( "output.stl", new Blob( [ data ], { type: "model/stl" } ) );

}

function saveFile( fileName, blobContents ) {

	const link = window.document.createElement( "a" );
	link.href = window.URL.createObjectURL( blobContents );
	link.download = fileName;
	document.body.appendChild( link );
	link.click();
	document.body.removeChild( link );

}

export default initApp;
