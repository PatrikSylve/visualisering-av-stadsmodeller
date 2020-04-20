Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiMTBhNjI0MC03NzY1LTQ1ZTMtYmQ4Yy0zMzhlZWE2MWE1MDgiLCJpZCI6MjE2MDIsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1ODAxMTUwMjB9.j8PKbNq9zznBU_AdSZ5O9M_xwhebg1a2HNdtaSnl47s';

var attributeMap = new Map();
var terrainAssetID = '';
var assetID = '';
var imagerySrc = ''; 

var viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProvider: new Cesium.CesiumTerrainProvider({
        url: Cesium.IonResource.fromAssetId(terrainAssetID)
    })
});



var tileset = viewer.scene.primitives.add(
    new Cesium.Cesium3DTileset({ url: Cesium.IonResource.fromAssetId(assetID) })
);

viewer.zoomTo(tileset);
var selected = {
    feature: undefined,
    originalColor: new Cesium.Color()
};


tileset.tileLoad.addEventListener(function (tile) {
    var content = tile.content;
    console.log("PropNames:");
    for (var i = 0; i < content.featuresLength; ++i) {

        var feature = content.getFeature(i);
        saveAttributes(feature)
    }
    console.log(attributeMap);
    createDropList();
});

addTerrain(imagerySrc); 


function saveAttributes(feature) {
    var names = feature.getPropertyNames();
    // for each feature, save attributeName and value to attributeMap
    for (var i = 0; i < names.length; i++) {
        var key = names[i];
        var value = feature.getProperty(key);
        if (!attributeMap.has(key)) {
            attributeMap.set(key, new Set());
        }

        attributeMap.get(key).add(value);
    }
}

// create droplist of attribute names
function createDropList() {
    let options = [];
    for (let key of attributeMap.keys()) {
        options.push(key);
    }

    var select = document.getElementById("dropList");
    select.innerHTML = '';


    options.forEach(function (opt) {
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = opt;
        select.appendChild(el);
    })
}

// when attribute name selected, create valuelist
function createValueList(el) {
    var selectedAttribute = el.value;
    var vList = document.getElementById("valueList");
    var options = attributeMap.get(selectedAttribute);
    vList.innerHTML = '';
    console.log("h")

    options.forEach(function (opt) {
        var tr = document.createElement("tr");
        var td1 = document.createElement("td");
        var td2 = document.createElement("td");

        var text = document.createTextNode(opt);


        var el = document.createElement("input");
        el.textContent = opt;
        el.class = "colorBox";
        el.id = opt;
        el.value = "#fffff0";
        el.type = "Color";
        console.log(1)
        el.onchange = function () {
            console.log("onCHange");
            attributeCol(opt, el.value, selectedAttribute)
        }
        console.log(2);
        td1.appendChild(text);
        td2.appendChild(el);
        tr.appendChild(td1);
        tr.appendChild(td2);

        vList.appendChild(tr);
    })
}


function attributeCol(value, color, selectedAttribute) {
    console.log(color, value, selectedAttribute);
    var styleString = "${" + selectedAttribute + "} === '" + value + "'";
    console.log(styleString);

    tileset.style = new Cesium.Cesium3DTileStyle({
        color: {
            conditions: [
                [styleString, hexToRgbA(color)],
            ]
        }
    });
}

function hexToRgbA(hex) {
    var c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return 'rgb(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ')';
    }
    throw new Error('Bad Hex');
}


// Create imagery 
function addTerrain(imgsrc) {
    // study area extent
    var coord = {
        "lowWest": [11.9161604, 57.692155],
        "upEast": [11.9832104, 57.7281055]
    }

    var layers = viewer.scene.imageryLayers;
    layers.addImageryProvider(new Cesium.SingleTileImageryProvider({
        url: imgsrc,
        rectangle: Cesium.Rectangle.fromDegrees(coord["lowWest"][0], coord["lowWest"][1], coord["upEast"][0], coord["upEast"][1])
    }));

}




viewer.extend(Cesium.viewerCesium3DTilesInspectorMixin);
var inspectorViewModel = viewer.cesium3DTilesInspector.viewModel;

// HTML overlay for showing feature name on mouseover
var nameOverlay = document.createElement('div');
viewer.container.appendChild(nameOverlay);
nameOverlay.className = 'backdrop';
nameOverlay.style.display = 'none';
nameOverlay.style.position = 'absolute';
nameOverlay.style.bottom = '0';
nameOverlay.style.left = '0';
nameOverlay.style['pointer-events'] = 'none';
nameOverlay.style.padding = '4px';
nameOverlay.style.backgroundColor = 'black';

// Information about the currently selected feature
var selected = {
    feature: undefined,
    originalColor: new Cesium.Color()
};

// An entity object which will hold info about the currently selected feature for infobox display
var selectedEntity = new Cesium.Entity();

// Get default left click handler for when a feature is not picked on left click
var clickHandler = viewer.screenSpaceEventHandler.getInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);

var pickedFeature;
var clickHandler = viewer.screenSpaceEventHandler.getInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
if (Cesium.PostProcessStageLibrary.isSilhouetteSupported(viewer.scene)) {
    // Silhouettes are supported
    var silhouetteBlue = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
    silhouetteBlue.uniforms.color = Cesium.Color.BLUE;
    silhouetteBlue.uniforms.length = 0.01;
    silhouetteBlue.selected = [];

    var silhouetteGreen = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
    silhouetteGreen.uniforms.color = Cesium.Color.LIME;
    silhouetteGreen.uniforms.length = 0.01;
    silhouetteGreen.selected = [];

    viewer.scene.postProcessStages.add(Cesium.PostProcessStageLibrary.createSilhouetteStage([silhouetteBlue, silhouetteGreen]));

    // Silhouette a feature blue on hover.
    viewer.screenSpaceEventHandler.setInputAction(function onMouseMove(movement) {
        // If a feature was previously highlighted, undo the highlight
        silhouetteBlue.selected = [];

        // Pick a new feature
        pickedFeature = viewer.scene.pick(movement.endPosition);
        if (!Cesium.defined(pickedFeature)) {
            nameOverlay.style.display = 'none';
            return;
        }

        // A feature was picked, so show it's overlay content
        nameOverlay.style.display = 'block';
        nameOverlay.style.bottom = viewer.canvas.clientHeight - movement.endPosition.y + 'px';
        nameOverlay.style.left = movement.endPosition.x + 'px';
        var name = pickedFeature.getProperty('name');
        console.log("name: ", name, pickedFeature, pickedFeature.getPropertyNames(), pickedFeature.getProperty("end_date"))

        if (!Cesium.defined(name)) {
            name = pickedFeature.getProperty('id');
            console.log("id: ", name)
        }
        nameOverlay.textContent = name;

        // Highlight the feature if it's not already selected.
        if (pickedFeature !== selected.feature) {
            silhouetteBlue.selected = [pickedFeature];
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Silhouette a feature on selection and show metadata in the InfoBox.
    viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(movement) {
        // If a feature was previously selected, undo the highlight
        silhouetteGreen.selected = [];

        // Pick a new feature
        var pickedFeature = viewer.scene.pick(movement.position);
        if (!Cesium.defined(pickedFeature)) {
            clickHandler(movement);
            return;
        }

        // Select the feature if it's not already selected
        if (silhouetteGreen.selected[0] === pickedFeature) {
            return;
        }

        // Save the selected feature's original color
        var highlightedFeature = silhouetteBlue.selected[0];
        if (pickedFeature === highlightedFeature) {
            silhouetteBlue.selected = [];
        }

        // Highlight newly selected feature
        silhouetteGreen.selected = [pickedFeature];

        // Set feature infobox description
        var featureName = pickedFeature.getProperty('name');
        selectedEntity.name = featureName;
        selectedEntity.description = 'Loading <div class="cesium-infoBox-loading"></div>';
        viewer.selectedEntity = selectedEntity;
        selectedEntity.description = '<table class="cesium-infoBox-defaultTable"><tbody>'

        for (var i = 0; i < pickedFeature.getPropertyNames().length; i++) {
            selectedEntity.description += '<tr><th>' + pickedFeature.getPropertyNames()[i] + '</th><td>' + pickedFeature.getProperty(pickedFeature.getPropertyNames()[i]) + '</td></tr>';
        }
        selectedEntity.description += '</tbody></table>';

    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
} else {
    // Silhouettes are not supported. Instead, change the feature color.

    // Information about the currently highlighted feature
    var highlighted = {
        feature: undefined,
        originalColor: new Cesium.Color()
    };

    // Color a feature yellow on hover.
    viewer.screenSpaceEventHandler.setInputAction(function onMouseMove(movement) {
        // If a feature was previously highlighted, undo the highlight
        if (Cesium.defined(highlighted.feature)) {
            highlighted.feature.color = highlighted.originalColor;
            highlighted.feature = undefined;
        }
        // Pick a new feature
        var pickedFeature = viewer.scene.pick(movement.endPosition);
        if (!Cesium.defined(pickedFeature)) {
            nameOverlay.style.display = 'none';
            return;
        }
        // A feature was picked, so show it's overlay content
        nameOverlay.style.display = 'block';
        nameOverlay.style.bottom = viewer.canvas.clientHeight - movement.endPosition.y + 'px';
        nameOverlay.style.left = movement.endPosition.x + 'px';
        var name = pickedFeature.getProperty('name');
        if (!Cesium.defined(name)) {
            name = pickedFeature.getProperty('id');
        }
        nameOverlay.textContent = name;
        // Highlight the feature if it's not already selected.
        if (pickedFeature !== selected.feature) {
            highlighted.feature = pickedFeature;
            Cesium.Color.clone(pickedFeature.color, highlighted.originalColor);
            pickedFeature.color = Cesium.Color.YELLOW;
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Color a feature on selection and show metadata in the InfoBox.
    viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(movement) {
        // If a feature was previously selected, undo the highlight
        if (Cesium.defined(selected.feature)) {
            selected.feature.color = selected.originalColor;
            selected.feature = undefined;
        }
        // Pick a new feature
        var pickedFeature = viewer.scene.pick(movement.position);
        if (!Cesium.defined(pickedFeature)) {
            clickHandler(movement);
            return;
        }
        // Select the feature if it's not already selected
        if (selected.feature === pickedFeature) {
            return;
        }
        selected.feature = pickedFeature;
        // Save the selected feature's original color
        if (pickedFeature === highlighted.feature) {
            Cesium.Color.clone(highlighted.originalColor, selected.originalColor);
            highlighted.feature = undefined;
        } else {
            Cesium.Color.clone(pickedFeature.color, selected.originalColor);
        }
        // Highlight newly selected feature
        pickedFeature.color = Cesium.Color.LIME;
        // Set feature infobox description
        var featureName = pickedFeature.getProperty('name');
        selectedEntity.name = featureName;
        selectedEntity.description = 'Loading <div class="cesium-infoBox-loading"></div>';
        viewer.selectedEntity = selectedEntity;
        selectedEntity.description = '<table class="cesium-infoBox-defaultTable"><tbody>' +
            '<tr><th>BIN</th><td>' + pickedFeature.getProperty('BIN') + '</td></tr>' +
            '<tr><th>DOITT ID</th><td>' + pickedFeature.getProperty('DOITT_ID') + '</td></tr>' +
            '<tr><th>SOURCE ID</th><td>' + pickedFeature.getProperty('SOURCE_ID') + '</td></tr>' +
            '<tr><th>Longitude</th><td>' + pickedFeature.getProperty('longitude') + '</td></tr>' +
            '<tr><th>Latitude</th><td>' + pickedFeature.getProperty('latitude') + '</td></tr>' +
            '<tr><th>Height</th><td>' + pickedFeature.getProperty('height') + '</td></tr>' +
            '<tr><th>Terrain Height (Ellipsoid)</th><td>' + pickedFeature.getProperty('TerrainHeight') + '</td></tr>' +
            '</tbody></table>';
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}



function pickObjects() {
    var pickedObjects = viewer.scene.drillPick(new Cesium.Cartesian2(10.0, 20.0), 100, 1000, 1000);
    for (let i = 0; i < pickedObjects.length; i++) {
        console.log(pickedObjects[i].getPropertyNames());
    }
}