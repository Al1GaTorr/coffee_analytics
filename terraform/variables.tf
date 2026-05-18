variable "region" {
  description = "Cloud region placeholder for real VM provisioning."
  type        = string
  default     = "local-lab"
}

variable "instance_type" {
  description = "VM size placeholder used by the capacity plan."
  type        = string
  default     = "sre-lab-medium"
}
