# Ansible Automation

This playbook automates:

- Docker installation
- Docker Compose plugin installation
- Application directory setup
- Backend stack deployment
- Gateway health verification

Run:

```bash
ansible-playbook -i ansible/inventory.ini ansible/deploy.yml
```
