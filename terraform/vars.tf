variable "project_name" {
  default = "hubs"
}
variable "environment" {
  default = "development" // override by setting in a vars.tfvars file
}
variable "db_backup_retention" {
  default = "30" // keep backups for 30 days
}
