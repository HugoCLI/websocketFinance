const shell = require("shelljs");
const chalk = require('chalk');
const https = require('https');
const fs = require('fs');
const ws = require('ws');

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

let version = null;
function newVersion() {
    let options = {
        hostname: 'api.hostname.fr',
        port: 443,
        path: '/v3/finance',
        method: 'GET'
    }
      
    let req = https.request(options, res => {
        res.setEncoding('utf8');
        res.on('data', d => {
            setTimeout(() => {
                d = JSON.parse(d);
                if(d.version != version) {
                    console.log(chalk.yellow('Nouvelle version disponible, téléchargement en cours... ('+d.version+')'));
                    downloadVersion(d);
                } else {
                        
                    fs.readFile('nodefinance.js', 'utf8', function (err,data) {
                        if (err) {
                            if(version != null) {
                                fs.unlinkSync('nodefinance.js');
                            }
                            shell.exec("node start.js");
                        } else {
                            console.log(chalk.green('Démarrage de nodefinance-'+d.version+'.js...'));
                            setTimeout(() => {
                                shell.exec("node nodefinance.js ; exit");
                            }, 1000);
                            
                        }
                    });
                    
                    
                }        
            }, 1000);
        })
    })
    req.end();

}


function createFile(name, data) {
    fs.writeFile(name, data, function (err) {
        if (err) throw err;
        console.log(chalk.gray(name+' => OK'));
        return;
    });
}
function downloadVersion(a) {
    console.log(chalk.gray('Downloading nodefinance-'+a.version+'.js...'));

    let path = '/v3/finance?file=nodefinance-'+a.version+'.js&version='+a.version;
    let options = {
        hostname: 'api.hostname.fr',
        port: 443,
        path: path,
        method: 'GET'
    }
      
    let req = https.request(options, res => {
        res.setEncoding('utf8');
        res.on('data', d => {
            
            
            if(isJson(d)) {
                d = JSON.parse(d);
                if(d.error) {
                    return console.log(chalk.red('La version '+a.version+' est indisponible. ('+(d.error).toUpperCase()+')'));
                }
                return console.log(chalk.red('La version '+a.version+' est indisponible. (INTERNAL_ERROR)'));
            } else {

                d = d.toString().replace(/\t/g, '');
                createFile('nodefinance.js', d);
                createFile('version.json', JSON.stringify(a));
                setTimeout(() => {
                    console.log(chalk.green('Démarrage de nodefinance-'+a.version+'.js...'));
                    shell.exec("node nodefinance.js ; exit");
                }, 1000);
                
            }
            return res;
            

        });
    });
    req.end();
    
}

fs.readFile('version.json', 'utf8', function (err,data) {
    if (!err) {
        data = JSON.parse(data);
        console.clear();
        version = data.version;
        console.log('Version : '+chalk.cyan(data.version) + ", recherche de nouvelle version...");
        newVersion();
    } else {
        newVersion();
    }
});




