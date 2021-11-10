// Provider configuration
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "3.1.0"
    }
  }
}


resource "random_string" "rds_apps_password" {
  length  = 34
  special = false
}

resource "aws_rds_cluster" "apps" {
  cluster_identifier      = "${var.project_name}-${var.environment}-db"
  engine                  = "aurora"
  engine_mode             = "serverless"
  master_username         = "admin"
  master_password         = "${random_string.rds_apps_password.result}"
  backup_retention_period = var.db_backup_retention
  apply_immediately       = true

  scaling_configuration {
    auto_pause               = true
    max_capacity             = 4
    min_capacity             = 2
    seconds_until_auto_pause = 300
  }
  // Do not recreate the DB if we change the password
  lifecycle {
    ignore_changes = ["master_password"]
  }
}

output "rds_host" {
  value = "${aws_rds_cluster.apps.endpoint}"
}

output "rds_creds" {
  value = "${aws_rds_cluster.apps.master_username}/${random_string.rds_apps_password.result}"
}

# TODO: import the EC2 used for the top level server using the following command: 
# resource "aws_instance" "toplevelserver" {
#  ami           = "unknown"
#  instance_type = "unknown"
# }


# Set region for RDS instance
provider "aws" {
  region = "us-east-1"
}
