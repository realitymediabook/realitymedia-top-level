#!/bin/bash
terraformDirectory="$(pwd)/.terraform" # this is where terraform stores various modules it uses to perform the operations
outfileName=$(date +%s) # get the current timestamp to use to name the state file that terraform uses to 

# get arguments
while getopts "action:" arg; do
  case $arg in
    n) actionToPerform=$OPTARG;;
  esac
done


case $actionToPerform in

  validate | plan)
   docker run --rm -it -v $HOME/.aws/credentials:/root/.aws/credentials -v $(pwd):/workspace -w /workspace hashicorp/terraform:latest init 
   docker run --rm -it -v $HOME/.aws/credentials:/root/.aws/credentials -v $(pwd):/workspace -w /workspace hashicorp/terraform:latest validate
   docker run --rm -it -v $HOME/.aws/credentials:/root/.aws/credentials -v $(pwd):/workspace -w /workspace hashicorp/terraform:latest plan -out $outfileName
    ;;

  deploy)
    docker run --rm -it -v $HOME/.aws/credentials:/root/.aws/credentials -v $(pwd):/workspace -w /workspace hashicorp/terraform:latest validate
    docker run --rm -it -v $HOME/.aws/credentials:/root/.aws/credentials -v $(pwd):/workspace -w /workspace hashicorp/terraform:latest plan  -out $outfileName
    docker run --rm -it -v $HOME/.aws/credentials:/root/.aws/credentials -v $(pwd):/workspace -w /workspace hashicorp/terraform:latest apply $outfileName
    ;;

  destroy)
    docker run --rm -it -v $HOME/.aws/credentials:/root/.aws/credentials -v $(pwd):/workspace -w /workspace hashicorp/terraform:latest validate
    docker run --rm -it -v $HOME/.aws/credentials:/root/.aws/credentials -v $(pwd):/workspace -w /workspace hashicorp/terraform:latest plan -destroy -out $outfileName
    docker run --rm -it -v $HOME/.aws/credentials:/root/.aws/credentials -v $(pwd):/workspace -w /workspace hashicorp/terraform:latest apply -destroy $outfileName
    ;;

  *)
    echo -n "Unknown command: $actionToPerform. Please use --plan to test Terraform code, --deploy to apply updates and --destroy to tear down infrastructure"
    ;;
esac
