/* 
    Study area bbox. 
    Must be squared area facing north. 
*/
const mapCoord = {
    NW: {
        N: 6401000.000,
        E: 145000.000
    },
    NE: {
        N: 6401000,
        E: 149000
    },
    SW: {
        N: 6397000,
        E: 145000
    },
    SE: {
        N: 6397000,
        E: 149000
    },
    minHeight: -2,
    maxHeightDiff: 85
}

// Height data source
const DEM = "";
// Ortophoto source
const ortofoto = "";

var terrainMaterial;

// Create a plane to hold background map as texture and DEM as heightmap 
function loadTerrain() {
    // bbox side length
    var planeSide = mapCoord.NE.N - mapCoord.SE.N;

    // terrain elevation variables 
    var heightDiff = mapCoord.maxHeightDiff;
    var minHeightVal = mapCoord.minHeight;


    terrainMaterial = new THREE.MeshPhongMaterial();

    // skapar ett plan som är 20x20 i storlek, med 199*199 rutor
    var geometry = new THREE.PlaneGeometry(planeSide, planeSide, 50, 50);

    // Load DEM and background map
    var displacementMap = THREE.ImageUtils.loadTexture(DEM);
    var texture = new THREE.TextureLoader().load(
        ortofoto,
        function () {
            renderer.render(scene, camera);
        }
    );

    terrainMaterial.displacementMap = displacementMap;
    terrainMaterial.displacementScale = heightDiff;
    terrainMaterial.displacementBias = 0;
    terrainMaterial.map = texture;
    terrainMaterial.side = THREE.DoubleSide;

    var plane = new THREE.Mesh(geometry, terrainMaterial);

    var centerN = mapCoord.SW.N + planeSide / 2;
    var centerE = mapCoord.SW.E + planeSide / 2;
    plane.position.set(centerE, centerN, minHeightVal);

    plane.frustumCulled = false;
    scene.add(plane);
    renderer.render(scene, camera);
}

// Change plane transparency
function terrainOpacity(m) {
    var val = m / 10;
    terrainMaterial.transparent = true;
    terrainMaterial.opacity = val;
    terrainMaterial.needsUpdate = true;
    renderer.render(scene, camera);
}

// Get unique attributes in CityJSON-file
function getUniqueAttributes() {
    var attributes = new Set(), key;
    // add all attribute names in a Set
    for (key in jsonDict) {
        let cityObj = jsonDict[key].CityObjects, obj;
        for (obj in cityObj) {
            let attrib = cityObj[obj].attributes, name;
            if (attrib) {
                for (name in attrib) {
                    attributes.add(name)
                }
            }
        }
    }
    if (attributes.size > 0) {
        createDropList(attributes);
    }
}


function createDropList(options) {
    var select = document.getElementById("dropList");
    select.innerHTML = '';
    options.forEach(function (opt) {
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = opt;
        select.appendChild(el);
    })
}

// Get attribute vales from CityJSON-object
function getAttributeValues(a) {
    let selectedAttribute = a.value;
    var valueSet = new Set();

    for (key in jsonDict) {
        let cityObj = jsonDict[key].CityObjects, obj;
        for (obj in cityObj) {
            if (cityObj[obj].attributes) {
                let attrib = cityObj[obj].attributes;
                for (name in attrib) {
                    if (selectedAttribute == name) {
                        valueSet.add(attrib[name])
                    }
                }
            }
        }
    }
    createValueList(valueSet, selectedAttribute);
}

function createValueList(options, selectedAttribute) {
    var vList = document.getElementById("valueList");
    vList.innerHTML = '';

    options.forEach(function (opt) {
        var tr = document.createElement("tr");
        var td1 = document.createElement("td");
        var td2 = document.createElement("td");
        var text = document.createTextNode(opt);


        var el = document.createElement("input");
        el.textContent = opt;
        el.class = "colorBox";
        el.id = opt;
        el.value = "#fffff1";
        el.type = "Color";
        console.log(1)
        el.onchange = function () {
            attributeCol(opt, el.value, selectedAttribute)
        }
        td1.appendChild(text);
        td2.appendChild(el);
        tr.appendChild(td1);
        tr.appendChild(td2);

        vList.appendChild(tr);
    })
}

// Change color of all objects by selected attribute and value
function attributeCol(val, c, selectedAttribute) {
    var color = c;
    var attribute = selectedAttribute;
    var value = val;

    changeObjects = [];
    for (k in jsonDict) {

        var obj = jsonDict[k].CityObjects;

        //add objID for each obj w attributevalue for each obj
        for (key in obj) {
            if (obj[key].attributes) {

                let attrib = obj[key]["attributes"];
                for (a in attrib) {
                    if (a == attribute) {
                        if (attrib[attribute] == value) {
                            changeObjects.push(key);
                        }
                    }
                }
            }
        }
    }

    //get the id of the first object that intersects (equals the clicked object)
    for (var i = 0; i < changeObjects.length; i++) {
        try {
            var currentMesh = scene.getObjectByName(changeObjects[i])
            color = color.replace(/#/, "0x");
            currentMesh.material.color.setHex(color);
        }
        catch (error) {
            console.log(error);
        }
    }
    renderer.render(scene, camera);
}

// Edit loaded CityJSON-data 
function edit(t) {
    var fileName = t.attributes["name"].value;
    var key = t.attributes["key"].value;
    var value = t.innerHTML;
    var cityObj = t.attributes["cityObject"].value;
    var p = prompt("Edit attribute", value);

    if (p != null || p != value) {
        t.innerHTML = p
        // change jsonDict attrib
        jsonDict[fileName].CityObjects[cityObj].attributes[key] = p;
        versioned[fileName]["edited"] = true;

    }
}


function saveJSON(m) {

    for (key in versioned) {
        if (versioned[key].edited == true) {
            $("#loader").show();
            var fileName = key;
            let jsons = JSON.stringify(jsonDict[fileName]);
            $.ajax({
                type: "POST",
                url: "php/get_json.php",
                data: {
                    state: jsons,
                    name: fileName
                },
                success: function (msg) {
                    console.log(msg)
                    var e = document.getElementById("download")
                    e.href = e.innerHTML = fileName + ".json";

                    $("#loader").hide();
                }
            });

        } else {
            console.log("no need to save, no edits made");
        }
    }

}


function saveVersioned() {
    var fileName = document.getElementById("selectSaveForm").value;
    var msg = document.getElementById('saveMessage').value;
    var author = document.getElementById('saveAuthor').value;
    var verVal = versioned[fileName]["versioned"];
    var json = JSON.stringify(jsonDict[fileName]);

    closeForm()
    $("#loader").show();

    $.ajax({
        type: "POST",
        url: "php/save_versioned.php",
        data: {
            state: json,
            name: fileName,
            author: author,
            msg: msg,
            versioned: verVal
        },
        success: function (msg) {
            console.log(msg)
            var e = document.getElementById("download")
            e.href = msg;
            e.innerHTML = e.href;
            $("#loader").hide();
        }
    });


}

// Form for saving versioned CityJSON
function openForm() {
    document.getElementById("myForm").style.display = "block";
    var select = document.getElementById('selectSaveForm');
    select.innerHTML = '';
    let option = document.createElement('option');
    option.textContent = "Select a file";
    option.disabled = true;
    option.hidden = true;
    option.selected = true;
    select.appendChild(option);

    for (i in jsonDict) {
        let option = document.createElement('option');
        option.textContent = i;
        option.value = i;
        select.appendChild(option);
    }
}

function closeForm() {
    document.getElementById("myForm").style.display = "none";
} 
