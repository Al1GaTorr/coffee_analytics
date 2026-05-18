terraform {
  required_version = ">= 1.5.0"
  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "node_count" {
  type    = number
  default = 3
}

locals {
  services = [
    "frontend",
    "api-gateway",
    "auth-service",
    "catalog-service",
    "order-service",
    "payment-service",
    "notification-service",
    "profile-service",
    "analytics-service"
  ]

  nodes = [
    for index in range(var.node_count) : {
      name       = "coffee-node-${index + 1}"
      ip         = "10.10.0.${index + 10}"
      role       = index == 0 ? "manager" : "worker"
      cpu_cores  = 2
      memory_gb  = 4
      disk_gb    = 40
    }
  ]
}

resource "local_file" "inventory" {
  filename = "${path.module}/generated-inventory.ini"
  content = join("\n", concat(
    ["[coffee_nodes]"],
    [for node in local.nodes : "${node.name} ansible_host=${node.ip} role=${node.role}"],
    ["", "[coffee_nodes:vars]"],
    ["ansible_user=ubuntu", "project_dir=/opt/coffee-analytics"]
  ))
}

resource "local_file" "capacity_plan" {
  filename = "${path.module}/generated-capacity-plan.json"
  content = jsonencode({
    environment = var.environment
    nodes       = var.node_count
    node_specs  = local.nodes
    services    = local.services
    sizing = {
      api_gateway = "2 replicas, 0.5 CPU, 256Mi"
      order       = "3-8 replicas via HPA, 1 CPU, 512Mi"
      payment     = "2 replicas, 0.5 CPU, 256Mi"
      database    = "managed PostgreSQL, 2 CPU, 4Gi minimum"
    }
  })
}

resource "null_resource" "vm_provision" {
  for_each = { for node in local.nodes : node.name => node }

  triggers = {
    node_name = each.value.name
    node_ip   = each.value.ip
    node_role = each.value.role
    env       = var.environment
  }

  provisioner "local-exec" {
    command = <<-EOT
      echo "[Terraform] Provisioning VM: ${each.value.name}"
      echo "  IP:       ${each.value.ip}"
      echo "  Role:     ${each.value.role}"
      echo "  CPU:      ${each.value.cpu_cores} cores"
      echo "  Memory:   ${each.value.memory_gb} GB"
      echo "  Disk:     ${each.value.disk_gb} GB"
      echo "  Env:      ${var.environment}"
      echo "[Terraform] VM ${each.value.name} ready for Ansible configuration."
    EOT
  }
}

output "inventory_file" {
  value       = local_file.inventory.filename
  description = "Path to the generated Ansible inventory"
}

output "capacity_plan_file" {
  value       = local_file.capacity_plan.filename
  description = "Path to the generated capacity plan"
}

output "provisioned_nodes" {
  value = {
    for node in local.nodes :
    node.name => {
      ip   = node.ip
      role = node.role
    }
  }
  description = "Summary of all provisioned nodes"
}
