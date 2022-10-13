
import {
	PerspectiveCamera,
	Vector3,
	Color,
	BoxGeometry,
	Mesh,
	Group,
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
group,
operation,
inputFiles,
currentBrush,
currentMaterial,
evaluator,
subtractMeshButton ,
intersectMeshButton,
saveMeshButton;

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

	group = new Group();
	group.rotation.x = - Math.PI * 0.5;
	scene.add( group );

	currentMaterial = new MeshLambertMaterial();

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
	contentDiv.style.position = "absolute";
	contentDiv.style.top = "0px";
	contentDiv.style.left = "0px";
	contentDiv.style.color = "white";
	contentDiv.style.backgroundColor = "black";
	contentDiv.style.opacity = "0.5";
	document.body.appendChild( contentDiv );

	const finalDiv = document.createElement( 'div' );
	finalDiv.style.width = "100%";
	const addMeshButton = document.createElement( 'button' );

	addMeshButton.innerHTML = "Add (union) a mesh...";
	finalDiv.appendChild( addMeshButton );

	subtractMeshButton = document.createElement( 'button' );
	subtractMeshButton.innerHTML = "Subtract a mesh...";
	subtractMeshButton.disabled = true;
	finalDiv.appendChild( subtractMeshButton );

	intersectMeshButton = document.createElement( 'button' );
	intersectMeshButton.innerHTML = "Intersect a mesh...";
	intersectMeshButton.disabled = true;
	finalDiv.appendChild( intersectMeshButton );

	saveMeshButton = document.createElement( 'button' );
	saveMeshButton.innerHTML = "Save result to STL...";
	saveMeshButton.disabled = true;
	finalDiv.appendChild( saveMeshButton );

	contentDiv.appendChild( finalDiv );

	addMeshButton.onclick = () => { newMesh( ADDITION ); };
	subtractMeshButton.onclick = () => { newMesh( SUBTRACTION ); };
	intersectMeshButton.onclick = () => { newMesh( INTERSECTION ); };
	saveMeshButton.onclick = saveSTL;

	onWindowResize();
	animate();

};

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

function newMesh( op ) {

	operation = op;
	inputFiles.click();

}

function onFilesLoaded( event ) {

	const files = event.target.files;

	if ( ! files || files.length === 0 ) return;

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

	performOperation( operation, geometry );

}

function performOperation( operation, geometry ) {

	const newBrush = new Brush( geometry, currentMaterial );

	if ( currentBrush ) {

		group.remove( currentBrush );

		currentBrush = evaluator.evaluate( currentBrush, newBrush, operation );

	}
	else currentBrush = newBrush;

	group.add( currentBrush );

	subtractMeshButton.disabled = false;
	intersectMeshButton.disabled = false;
	saveMeshButton.disabled = false;

}

function saveSTL() {

	if ( ! currentBrush ) return;

	const exporter = new STLExporter();
	const data = exporter.parse( currentBrush, { binary: true } );
	saveFile( "output.stl", new Blob( [ data ], { type: "model/stl" } ) );

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
