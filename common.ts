import fs = require('fs');
import csv = require('csv-parser');

export enum REPO {
    SWAGGER_REPO="azure-rest-api-specs",
    TF_PROVIDER_REPO= "terraform-provider-azurerm",
    CLI_REPO = "azure-cli",
    DEPTH_COVERAGE_REPO = "depth-coverage-pipeline"
  }
  
  export enum ORG {
    AZURE = "Azure",
    MS = "microsoft"
  }
  
  export enum SDK {
    TF_SDK="terraform",
    CLI_CORE_SDK="clicore",
    CLI_EXTENSTION_SDK="cliextension"
  }
  
  export enum README {
    TF_README_FILE="readme.trenton.md",
    CLI_README_FILE="readme.az.md"
  }

  export function readCVS(filepath: string): any[] {
      let results: any[] = [];
      

    //   var parser = parse({delimiter: ','}, function(err, data) {
    //       console.log(data);
    //   });

    console.log(__dirname+'/TFCandidate.csv');
      fs.createReadStream(filepath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            console.log(results);
        });
      return results;
  }