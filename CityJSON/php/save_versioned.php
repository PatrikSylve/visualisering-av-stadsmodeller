<?php

    $author = $_POST["author"]; 
    $msg = $_POST["msg"]; 
    $name = $_POST["name"]; 

    $checkout_name = "versions/" . $name . '_versioned.json'; 

    # save json file
    $response = $_POST["state"];
    $fp = fopen('versions/saved/' . $name . '.json', 'w');
    fwrite($fp, json_encode(json_decode($response)));
    fclose($fp);

    if ($_POST["versioned"] == "true") {
        commit();
    } else {
        init_commit();
    }

    function init_commit() {
        global $name;
        global $author;
        global $msg;
        global $checkout_name;
        # create new version file 
        $command = escapeshellcmd('python cityjson-versioning-prototype-master/cjv.py init commit versions/saved/' . $name . '.json master "' . $author . '" "' . $msg . '" ' . $checkout_name);
        $output = shell_exec($command);

    }

    function commit() {
        global $name;
        global $author;
        global $msg;
        global $checkout_name;
        # get origin version file and commit edited 
        $command = escapeshellcmd('python cityjson-versioning-prototype-master/cjv.py ' . 'versions/' . $name . '_versions.json commit versions/saved/' . $name . '.json master  "' . $author . '" "' . $msg . '" ' . $checkout_name);
        $output = shell_exec($command);

    }
    
    
    echo $checkout_name;

?>