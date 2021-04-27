import { DeleteBranch, ReadFileFromRepo, ReadCustomizeFiles, listOpenPullRequest, SubmitPullRequest } from "./CodeRepoGit";
import { IsValidCodeGenerationExist, InsertCodeGeneration, UpdateCodeGenerationValue } from "./CodeGeneration";
import { createBranch, uploadToRepo, createPullRequest, getBlobContent, NewOctoKit, getCurrentCommit, getBranch } from "../gitutil/GitAPI";
import { ResourceAndOperation, RESOUCEMAPFile, ENVKEY } from "./Model";
import { CodeGeneration, CodeGenerationDBColumn, CodeGenerationStatus } from "./CodeGenerationModel";
import { SDK, REPO, ORG, README } from "./common";

export class CodeGenerateHandler {
    /**
     * 
     * @param token The Github token
     * @param org The code gen pipeline org
     * @param repo The code gen pipeline repo
     * @param basebranch The base branch
     * @param rp The resource provider to generate
     * @param sdk The target sdk
     * @param onbaordtype onbaord type
     * @param resources The resource list to generate
     */
    public async TriggerCodeGeneration2(token: string, org: string, repo: string, basebranch: string, rp: string, sdk: string, onbaordtype: string, resources:string = undefined) {
        // const RESOUCEMAPFile = "ToGenerate.json";
        const octo = NewOctoKit(token);
        let alreadyOnboard: boolean = await IsValidCodeGenerationExist(process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
            process.env[ENVKEY.ENV_CODEGEN_DATABASE],
            process.env[ENVKEY.ENV_CODEGEN_DB_USER],
            process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
            rp,
            sdk,
            onbaordtype);
        if (alreadyOnboard) {
            console.log("Already triggerred to onboard " + rp + ". Ignore this one.");
            return;
        }

        let readmefile: string = ""
        let rs: ResourceAndOperation = new ResourceAndOperation(rp, readmefile, [], sdk);
        rs.generateResourceList();
        if (resources !== undefined) rs.resourcelist = resources;

        const branchName = onbaordtype + "-" + rs.target + "-" + rs.RPName;
        const baseCommit = await getCurrentCommit(octo, org, repo, basebranch);
        const targetBranch = await getBranch(octo, org, repo, branchName);
        // if (targetBranch !== undefined) {
        //     console.log("resource branch already exist.")
        //     return;
        // }
        await createBranch(octo, org, repo, branchName, baseCommit.commitSha);
        const fs = require('fs');
        fs.writeFileSync(RESOUCEMAPFile, JSON.stringify(rs, null, 2));
        await uploadToRepo(octo, ["ToGenerate.json"], org, repo, branchName);
        /* create pull request. */
        await createPullRequest(octo, org, repo, basebranch, branchName, "pull request from branch " + branchName);
    
        let content = await getBlobContent(octo, org, repo, branchName, RESOUCEMAPFile);
        console.log(content);

        /* update code generation status table. */
        let cg: CodeGeneration = new CodeGeneration(rp, sdk, onbaordtype);
        let e = await InsertCodeGeneration(process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
                process.env[ENVKEY.ENV_CODEGEN_DATABASE],
                process.env[ENVKEY.ENV_CODEGEN_DB_USER],
                process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
                cg);
        if (e !== undefined) {
            console.log(e);
        }
    }

    public async TriggerCodeGeneration(token: string, org: string, repo: string, basebranch: string, rpToGen:ResourceAndOperation):Promise<any> {
        // const RESOUCEMAPFile = "ToGenerate.json";
        const octo = NewOctoKit(token);
        let alreadyOnboard: boolean = await IsValidCodeGenerationExist(process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
            process.env[ENVKEY.ENV_CODEGEN_DATABASE],
            process.env[ENVKEY.ENV_CODEGEN_DB_USER],
            process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
            rpToGen.RPName,
            rpToGen.target,
            rpToGen.onboardType);
        if (alreadyOnboard) {
            console.log("Already triggerred to onboard " + rpToGen.RPName + ". Ignore this one.");
            return;
        }

        // let readmefile: string = ""
        // let rs: ResourceAndOperation = new ResourceAndOperation(rp, readmefile, [], sdk);
        // rs.generateResourceList();
        // if (resources !== undefined) rs.resourcelist = resources;
        try {
            const branchName = rpToGen.onboardType + "-" + rpToGen.target + "-" + rpToGen.RPName;
            const baseCommit = await getCurrentCommit(octo, org, repo, basebranch);
            const targetBranch = await getBranch(octo, org, repo, branchName);
            // if (targetBranch !== undefined) {
            //     console.log("resource branch already exist.")
            //     return;
            // }
            await createBranch(octo, org, repo, branchName, baseCommit.commitSha);
            const fs = require('fs');
            fs.writeFileSync(RESOUCEMAPFile, JSON.stringify(rpToGen, null, 2));
            await uploadToRepo(octo, ["ToGenerate.json"], org, repo, branchName);
            /* create pull request. */
            await createPullRequest(octo, org, repo, basebranch, branchName, "pull request from branch " + branchName);
        
            let content = await getBlobContent(octo, org, repo, branchName, RESOUCEMAPFile);
            console.log(content);

            /* insert code generation status table. */
            let cg: CodeGeneration = new CodeGeneration(rpToGen.RPName, rpToGen.target, rpToGen.onboardType);
            let e = await InsertCodeGeneration(process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
                    process.env[ENVKEY.ENV_CODEGEN_DATABASE],
                    process.env[ENVKEY.ENV_CODEGEN_DB_USER],
                    process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
                    cg);
            if (e !== undefined) {
                console.log(e);
            }
        }catch(ex) {
            console.log(ex);
            return ex;
        }

        return undefined;
    }
    public async CompleteCodeGeneration(token: string, rp: string, sdk: string, onbaordtype: string, codegenorg: string, sdkorg: string, swaggerorg: string) : Promise<any> {  
    //     const branch = onbaordtype + "-" + sdk.toLowerCase() + "-" + rp;
    //     /* delete depth-coverage rp branch */
    //     let err = await DeleteBranch(token, codegenorg, REPO.DEPTH_COVERAGE_REPO, branch);
        

    //     /* delete sdk rp branch. */
    //     let sdkrepo = "";
    //     if (sdk === SDK.TF_SDK) {
    //         sdkrepo = REPO.TF_PROVIDER_REPO;
    //     } else if (sdk === SDK.CLI_CORE_SDK) {
    //         sdkrepo = REPO.CLI_REPO;
    //     } else if (sdk === SDK.CLI_EXTENSTION_SDK) {
    //         sdkrepo = REPO.CLI_EXTENSION_REPO;
    //     }

    //     try {
    //         await DeleteBranch(token, sdkorg, sdkrepo, branch);
    //         let codebranch = onbaordtype + "-code-" + sdk.toLowerCase() + "-" + rp;
    //         await DeleteBranch(token, sdkorg, sdkrepo, codebranch);
    //     } catch(e) {
    //         console.log("Failed to delete sdk branch: " + branch);
    //         console.log(e);
    //     }

    //     /*delete swagger rp branch */
    //     try {
    //         await DeleteBranch(token, swaggerorg, REPO.SWAGGER_REPO, branch);
    //     } catch(e) {
    //         console.log("Failed to delete swagger branch: " + branch);
    //         console.log(e);
    //     }

        const err = this.ClearCodeGenerationWorkSpace(token, rp, sdk, onbaordtype, codegenorg, sdkorg, swaggerorg);
        /* update code generation status table. */
        const uperr = await UpdateCodeGenerationValue(process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
            process.env[ENVKEY.ENV_CODEGEN_DATABASE],
            process.env[ENVKEY.ENV_CODEGEN_DB_USER],
            process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
            rp,
            sdk,
            onbaordtype,
            CodeGenerationDBColumn.CODE_GENERATION_COLUMN_STATUS,
            CodeGenerationStatus.CODE_GENERATION_STATUS_COMPLETED);

        if (uperr !== undefined) {
            console.log(uperr);
        }

        return err;
    }

    public async CancelCodeGeneration(token: string, rp: string, sdk: string, onbaordtype: string, codegenorg: string, sdkorg: string, swaggerorg: string) : Promise<any> {  
    //     const branch = onbaordtype + "-" + sdk.toLowerCase() + "-" + rp;
    //     /* delete depth-coverage rp branch */
    //     let err = await DeleteBranch(token, codegenorg, REPO.DEPTH_COVERAGE_REPO, branch);
        

    //     /* delete sdk rp branch. */
    //     let sdkrepo = "";
    //     if (sdk === SDK.TF_SDK) {
    //         sdkrepo = REPO.TF_PROVIDER_REPO;
    //     } else if (sdk === SDK.CLI_CORE_SDK) {
    //         sdkrepo = REPO.CLI_REPO;
    //     } else if (sdk === SDK.CLI_EXTENSTION_SDK) {
    //         sdkrepo = REPO.CLI_EXTENSION_REPO;
    //     }

    //     try {
    //         await DeleteBranch(token, sdkorg, sdkrepo, branch);
    //         let codebranch = onbaordtype + "-code-" + sdk.toLowerCase() + "-" + rp;
    //         await DeleteBranch(token, sdkorg, sdkrepo, codebranch);
    //     } catch(e) {
    //         console.log("Failed to delete sdk branch: " + branch);
    //         console.log(e);
    //     }

    //     /*delete swagger rp branch */
    //     try {
    //         await DeleteBranch(token, swaggerorg, REPO.SWAGGER_REPO, branch);
    //     } catch(e) {
    //         console.log("Failed to delete swagger branch: " + branch);
    //         console.log(e);
    //     }

        const err = this.ClearCodeGenerationWorkSpace(token, rp, sdk, onbaordtype, codegenorg, sdkorg, swaggerorg);
        /* update code generation status table. */
        const uperr = await UpdateCodeGenerationValue(process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
            process.env[ENVKEY.ENV_CODEGEN_DATABASE],
            process.env[ENVKEY.ENV_CODEGEN_DB_USER],
            process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
            rp,
            sdk,
            onbaordtype,
            CodeGenerationDBColumn.CODE_GENERATION_COLUMN_STATUS,
            CodeGenerationStatus.CODE_GENERATION_STATUS_CANCELED);
            
        if (uperr !== undefined) {
            console.log(uperr);
        }

        return err;
    }

    public async ClearCodeGenerationWorkSpace(token: string, rp: string, sdk: string, onbaordtype: string, codegenorg: string, sdkorg: string, swaggerorg: string) : Promise<any> {  
        const branch = onbaordtype + "-" + sdk.toLowerCase() + "-" + rp;
        /* delete depth-coverage rp branch */
        let err = await DeleteBranch(token, codegenorg, REPO.DEPTH_COVERAGE_REPO, branch);
        

        /* delete sdk rp branch. */
        let sdkrepo = "";
        if (sdk === SDK.TF_SDK) {
            sdkrepo = REPO.TF_PROVIDER_REPO;
        } else if (sdk === SDK.CLI_CORE_SDK) {
            sdkrepo = REPO.CLI_REPO;
        } else if (sdk === SDK.CLI_EXTENSTION_SDK) {
            sdkrepo = REPO.CLI_EXTENSION_REPO;
        }

        try {
            await DeleteBranch(token, sdkorg, sdkrepo, branch);
            let codebranch = onbaordtype + "-code-" + sdk.toLowerCase() + "-" + rp;
            await DeleteBranch(token, sdkorg, sdkrepo, codebranch);
        } catch(e) {
            console.log("Failed to delete sdk branch: " + branch);
            console.log(e);
        }

        /*delete swagger rp branch */
        try {
            await DeleteBranch(token, swaggerorg, REPO.SWAGGER_REPO, branch);
        } catch(e) {
            console.log("Failed to delete swagger branch: " + branch);
            console.log(e);
        }

        return err;
    }

    /*Onboard, submit generated code to sdk repo, and readme to swagger repo. */
    public async SubmitGeneratedCode(rp:string, sdk:string, token: string, swaggerorg:string = undefined, org:string = undefined, type: string = "depth"):Promise<any> {
        try {
            const octo = NewOctoKit(token);
            /* generate PR in swagger repo. */
            let basebranch="master"
            sdk = sdk.toLowerCase();
            let branch = type + "-" + sdk + "-" + rp;
            
            await createPullRequest(octo, swaggerorg !== undefined ? swaggerorg: ORG.AZURE, REPO.SWAGGER_REPO, basebranch, branch, "[Depth Coverage, " + rp+ "]pull request from pipeline " + branch);
    
            /* generate PR in sdk code repo. */
            let sdkrepo = "";
            let sdkbasebranch = "master";
            let sdkorg = org;
            if (sdkorg === undefined) {
                if (sdk === SDK.TF_SDK) {
                    sdkrepo = REPO.TF_PROVIDER_REPO;
                    sdkorg = ORG.MS;
                } else if (sdk === SDK.CLI_CORE_SDK) {
                    sdkrepo = REPO.CLI_REPO;
                    sdkbasebranch="dev";
                } else if (sdk === SDK.CLI_EXTENSTION_SDK) {
                    sdkrepo = REPO.CLI_REPO;
                    sdkbasebranch="master";
                }
            }
            
             await createPullRequest(octo, sdkorg, sdkrepo, sdkbasebranch, branch, "[Depth Coverage, " + rp+ "]pull request from pipeline " + branch);
    
             /* close work sdk branch. */
             let workbranch = type + "-code-" + sdk + "-" + rp;
             await DeleteBranch(token, sdkorg, sdkrepo, workbranch);

             /* update the code generation status. */
              /* update code generation status table. */
            const uperr = await UpdateCodeGenerationValue(process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
                process.env[ENVKEY.ENV_CODEGEN_DATABASE],
                process.env[ENVKEY.ENV_CODEGEN_DB_USER],
                process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
                rp,
                sdk,
                type,
                CodeGenerationDBColumn.CODE_GENERATION_COLUMN_STATUS,
                CodeGenerationStatus.CODE_GENERATION_STATUS_PIPELINE_COMPLETED);

            if (uperr !== undefined) {
                console.log(uperr);
            }
    
        } catch(err) {
            console.log(err);
            return err;
        }
    
        return undefined;
    }

    /*customize an code generation. */
    public async CustomizeCodeGeneration(token:string, rp: string, sdk: string, onboardType:string, triggerPR: string, codePR: string, org: string = undefined, excludeTest: boolean = false):Promise<any> {
        const octo = NewOctoKit(token);
        let custmizeerr:any = undefined;
        // const org = ORG.AZURE;
        let sdkorg = ORG.AZURE;
        sdk = sdk.toLowerCase();
        if (sdk === SDK.TF_SDK) {
            sdkorg = ORG.MS;
            sdk = sdk.toLowerCase();
        }
    
        const branch = onboardType + "-" + sdk + "-" + rp;
    
        let sdkrepo = "";
        let readfile = README.CLI_README_FILE;
        if (sdk === SDK.TF_SDK) {
            sdkrepo = REPO.TF_PROVIDER_REPO;
            readfile = README.TF_README_FILE;
        } else if (sdk === SDK.CLI_CORE_SDK) {
            sdkrepo = REPO.CLI_REPO;
        }
    
        const jsonMapFile: string = "ToGenerate.json";
        const fs = require('fs');
        let filepaths: string[] = [];
    
        let content = await ReadFileFromRepo(token, ORG.AZURE, REPO.DEPTH_COVERAGE_REPO, branch, jsonMapFile);
        /* exclude test. */
        if (content !== undefined && content.length > 0) {
            //let content = fs.readFileSync(jsonMapFile);
            let resource:ResourceAndOperation = JSON.parse(content);
            let excludes: string[] = [];
            if (resource.excludeStages !== undefined && resource.excludeStages.length > 0) excludes = resource.excludeStages.split(";");
            let ischanged: boolean = false;
            if (excludeTest) {
                if (excludes.indexOf("MockTest") === -1) {
                    ischanged = true;
                    excludes.push("MockTest");
                }
                if (excludes.indexOf("LiveTest") === -1) {
                    ischanged = true;
                    excludes.push("LiveTest");
                }
                resource.excludeStages = excludes.join(";");
            } else {
                let newArray = excludes.filter(item => item !== "MockTest" && item !== "LiveTest");
                if (newArray.length !== excludes.length) {
                    resource.excludeStages = newArray.join(";");
                    ischanged = true;
                }
            }
    
            if (ischanged) {
                fs.writeFileSync(jsonMapFile, JSON.stringify(resource, null, 2));
                filepaths.push(jsonMapFile);
            }
        }
        
        const prNumber = codePR.split("/").pop();
        const filelist:string[] = [readfile, "schema.json"];
        await ReadCustomizeFiles(token, org !== undefined ? org :sdkorg, sdkrepo, +prNumber, filelist);
    
        
        /* copy configuration to swagger repo */
        
        
        console.log(__dirname);
        const specpath = "specification/" + rp + "/resource-manager";
        if (!fs.existsSync(specpath)){
            fs.mkdirSync(specpath, { recursive: true });
        }
        const swaggerReadMePath = "specification/" + rp + "/resource-manager/" + readfile;
        fs.copyFile(readfile, swaggerReadMePath, (err) => { 
            if (err) { 
                console.log("Error Found:", err); 
            } 
            else { 
            
            // Get the current filenames 
            // after the function 
            fs.readdirSync(__dirname).forEach(file => { 
                console.log(file); 
            }); 
            console.log("\nFile Contents of copied_file:");
            } 
        });
    
        filepaths.push(swaggerReadMePath);
    
        if (sdk === SDK.TF_SDK) {
            const schemapath = "schema.json";
            const swaggerSchemaPath = "specification/" + rp + "/resource-manager/" + schemapath;
            fs.copyFile(schemapath, swaggerSchemaPath, (err) => { 
                if (err) { 
                    console.log("Error Found:", err); 
                } 
                else { 
                    // Get the current filenames 
                    // after the function 
                    fs.readdirSync(__dirname).forEach(file => { 
                        console.log(file); 
                    }); 
                    console.log("\nFile Contents of copied_file:");
                } 
            });
            filepaths.push(swaggerSchemaPath);
        }
    
        try {
            /* update depth-coverage-pipeline trigger pull request. */
            await uploadToRepo(octo, filepaths, ORG.AZURE, REPO.DEPTH_COVERAGE_REPO, branch);
        } catch(e) {
            console.log(e);
            return e;
        }
        
    
    
        if (custmizeerr === undefined) {
            /* update the code generation status. */
            const uperr = await UpdateCodeGenerationValue(process.env[ENVKEY.ENV_CODEGEN_DB_SERVER],
                                                        process.env[ENVKEY.ENV_CODEGEN_DATABASE],
                                                        process.env[ENVKEY.ENV_CODEGEN_DB_USER],
                                                        process.env[ENVKEY.ENV_CODEGEN_DB_PASSWORD],
                                                        rp, 
                                                        sdk,
                                                        onboardType,
                                                        CodeGenerationDBColumn.CODE_GENERATION_COLUMN_STATUS,
                                                        CodeGenerationStatus.CODE_GENERATION_STATUS_CUSTOMIZING);
        }
        /* delete sdk rp branch. */

        return undefined;
    
    }

    public async GenerateCodeRullRequest(token: string, org: string, repo: string, title: string, branch: string, basebranch: string): Promise<{prlink:string, err:any}> {
        console.log("org:" + org + ",repo:" + repo + ",title:" + title + ",branch:" + branch + ",base:" + basebranch);
        let prlink:string = undefined;
        let err:any = undefined;
        try {
            const pulls: string[] = await listOpenPullRequest(token, org, repo, branch, basebranch);
            if (pulls.length > 0) {
                prlink= pulls[0]
            } else {
                let {prlink:ret, err:e} = await SubmitPullRequest(token, org, repo, title, branch, basebranch);
                prlink = ret;
                err = e;
            }
        }catch(e) {
            console.log(e);
            err = e;
        }

        return {prlink, err};

    }
}

export default new CodeGenerateHandler(); 