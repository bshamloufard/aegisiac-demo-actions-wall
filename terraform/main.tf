resource "aws_security_group" "edge" {
  name        = "aegis-demo-edge"
  description = "Demo public ingress path"

  ingress {
    description = "Public HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "primary" {
  identifier = "aegis-demo-primary"
  engine     = "postgres"
}
