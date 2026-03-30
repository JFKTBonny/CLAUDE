FROM jenkins/jenkins:lts
USER root
RUN  chown -R jenkins:jenkins /home/bonny/CLAUDE/Aplications/ecommerce-platform \
    chmod 777 /home/bonny/CLAUDE/Aplications/ecommerce-platform     
# 1. Install prerequisites
RUN apt-get update && apt-get install -y \
    lsb-release \
    ca-certificates \
    curl \
    gnupg

# 2. Install Docker CLI
RUN curl -fsSLo /usr/share/keyrings/docker-archive-keyring.asc \
    https://download.docker.com/linux/debian/gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.asc] \
    https://download.docker.com/linux/debian $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list && \
    apt-get update && apt-get install -y docker-ce-cli

# 3. Install Docker Compose
RUN curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && \
    chmod +x /usr/local/bin/docker-compose

# 4. Critical: Match Group ID for the Docker Socket
# Check your host GID: 'stat -c %g /var/run/docker.sock'
# If it's not 999, change it here.
RUN groupadd -g 137 docker && usermod -aG docker jenkins

USER jenkins