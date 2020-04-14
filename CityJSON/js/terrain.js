// EPSG:3007 -  study area bbox 
const mapCoord = {
    upLeft: {
        N: 6401000.000,
        E: 145000.000
    },
    upRight: {
        N: 6401000,
        E: 149000
    },
    lowLeft: {
        N: 6397000,
        E: 145000
    },
    lowRight: {
        N: 6397000,
        E: 149000
    },
    minHeigth: -2,
    maxHeigthDiff: 85
}

const DEM = "data/texture/big_gbg.png";
const ortofoto = "data/texture/Kville_xsmall.jpg";

var terrainMaterial;

// Create a plane to hold background map as texture and DEM as heightmap 
function loadTerrain() {
    // bbox side length
    var planeSide = mapCoord.upLeft.N - lowLeft.N;

    // terrain elevation variables 
    var heightDiff = mapCoord.maxHeigthDiff;
    var minHeightVal = mapCoord.maxHeigthDiff;


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

    plane.position.set(147000.000, 6399000.000, minHeightVal);
    plane.frustumCulled = false;
    scene.add(plane);
    renderer.render(scene, camera);
}

// Change background plane a
function terrainOpacity(m) {
    var val = m / 10;
    terrainMaterial.transparent = true;
    terrainMaterial.opacity = val;
    terrainMaterial.needsUpdate = true;
    renderer.render(scene, camera);
}


function getUniqueAttributes() {
    var attributes = new Set(), key;

    // add all attribute names in a Set
    for (key in jsonDict) {
        let cityObj = jsonDict[key].CityObjects, obj;
        for (obj in cityObj) {
            let attrib = cityObj[obj].attributes, name;
            if (attrib) {
                for (name in attrib) {
                    console.log(name)
                    attributes.add(name)
                }
            }
        }
    }
    if (attributes.size > 0) {
        createDropList(attributes);
    }
}

// attributes for the attribute drop down
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

// when attribute is selected from droplist
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
        console.log(2);
        td1.appendChild(text);
        td2.appendChild(el);
        tr.appendChild(td1);
        tr.appendChild(td2);

        vList.appendChild(tr);
    })
}

function attributeCol(val, c, selectedAttribute) {
    console.log(val)
    var color = c;
    var attribute = selectedAttribute;
    var value = val;


    changeObjects = [];
    for (k in jsonDict) {

        var obj = jsonDict[k].CityObjects;

        //add objid for each obj w attributevalue for each obj
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
            console.log("hej", error);
        }
    }
    renderer.render(scene, camera);
}


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
                url: "get_json.php",
                data: {
                    state: jsons,
                    name: fileName

                },
                //dataType:"text",
                success: function (msg) {
                    console.log(msg)
                    var e = document.getElementById("download")
                    e.href = fileName + ".json";
                    e.innerHTML = "länk"
                    $("#loader").hide();
                }
            });

        } else {
            console.log("no need to save, no edits made");
        }
    }

}

function saveVersioned() {

    // PHP som sparar över inladdad versionfil med master som branch
    // nedladdningslänk 

    var fileName = document.getElementById("selectSaveForm").value;
    var msg = document.getElementById('saveMessage').value;
    var author = document.getElementById('saveAuthor').value;
    var verVal = versioned[fileName]["versioned"];
    var json = JSON.stringify(jsonDict[fileName]);

    closeForm()
    $("#loader").show();

    $.ajax({
        type: "POST",
        url: "save_versioned.php",
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
            e.innerHTML = "länk"
            $("#loader").hide();
        }
    });


}

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
