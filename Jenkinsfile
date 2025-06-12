pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        DOCKER_IMAGE = 'nestjs-app'
        DOCKER_REGISTRY = credentials('docker-registry')
        DB_CREDENTIALS = credentials('database-credentials')
        SONAR_TOKEN = credentials('sonar-token')
        SLACK_WEBHOOK = credentials('slack-webhook')
    }
    
    stages {
        stage('🏗️ Setup') {
            steps {
                script {
                    echo "Setting up build environment..."
                    sh "node --version"
                    sh "npm --version"
                }
            }
        }
        
        stage('📥 Install Dependencies') {
            steps {
                script {
                    echo "Installing Node.js dependencies..."
                    sh "npm ci"
                }
            }
        }
        
        stage('🔍 Code Quality') {
            parallel {
                stage('Lint') {
                    steps {
                        script {
                            echo "Running ESLint..."
                            sh "npm run lint"
                        }
                    }
                }
                stage('Format Check') {
                    steps {
                        script {
                            echo "Checking code formatting..."
                            sh "npm run format:check"
                        }
                    }
                }
                stage('Type Check') {
                    steps {
                        script {
                            echo "Running TypeScript type check..."
                            sh "npm run type-check"
                        }
                    }
                }
            }
        }
        
        stage('🧪 Testing') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        script {
                            echo "Running unit tests..."
                            sh """
                                export DATABASE_URL="postgresql://\${DB_CREDENTIALS_USR}:\${DB_CREDENTIALS_PSW}@localhost:5432/test_db"
                                npm run test:cov
                            """
                        }
                    }
                    post {
                        always {
                            publishCoverage adapters: [
                                istanbulCoberturaAdapter('coverage/cobertura-coverage.xml')
                            ], sourceFileResolver: sourceFiles('STORE_LAST_BUILD')
                        }
                    }
                }
                stage('E2E Tests') {
                    steps {
                        script {
                            echo "Running E2E tests..."
                            sh """
                                export DATABASE_URL="postgresql://\${DB_CREDENTIALS_USR}:\${DB_CREDENTIALS_PSW}@localhost:5432/test_db"
                                export JWT_SECRET="test-secret"
                                npm run test:e2e
                            """
                        }
                    }
                }
            }
        }
        
        stage('🔒 Security Analysis') {
            parallel {
                stage('Dependency Audit') {
                    steps {
                        script {
                            echo "Running npm security audit..."
                            sh "npm audit --audit-level=high"
                        }
                    }
                }
                stage('SonarQube Analysis') {
                    steps {
                        script {
                            echo "Running SonarQube analysis..."
                            withSonarQubeEnv('SonarQube') {
                                sh """
                                    sonar-scanner \
                                        -Dsonar.projectKey=nestjs-app \
                                        -Dsonar.sources=src \
                                        -Dsonar.tests=test \
                                        -Dsonar.typescript.lcov.reportPaths=coverage/lcov.info \
                                        -Dsonar.login=\${SONAR_TOKEN}
                                """
                            }
                        }
                    }
                }
            }
        }
        
        stage('🏗️ Build') {
            steps {
                script {
                    echo "Building application..."
                    sh "npm run build"
                }
            }
            post {
                success {
                    archiveArtifacts artifacts: 'dist/**/*', fingerprint: true
                }
            }
        }
        
        stage('🐳 Docker Build') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                script {
                    echo "Building Docker image..."
                    def image = docker.build("${DOCKER_IMAGE}:${BUILD_NUMBER}")
                    
                    echo "Pushing Docker image to registry..."
                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-registry-credentials') {
                        image.push()
                        image.push("latest")
                    }
                }
            }
        }
        
        stage('🚀 Deploy') {
            parallel {
                stage('Deploy to Staging') {
                    when {
                        branch 'develop'
                    }
                    steps {
                        script {
                            echo "Deploying to staging environment..."
                            // Add deployment script for staging
                            sh """
                                docker-compose -f docker-compose.staging.yml down
                                docker-compose -f docker-compose.staging.yml pull
                                docker-compose -f docker-compose.staging.yml up -d
                            """
                        }
                    }
                }
                stage('Deploy to Production') {
                    when {
                        branch 'main'
                    }
                    steps {
                        script {
                            echo "Deploying to production environment..."
                            input message: 'Deploy to production?', ok: 'Deploy'
                            
                            // Add deployment script for production
                            sh """
                                docker-compose -f docker-compose.prod.yml down
                                docker-compose -f docker-compose.prod.yml pull
                                docker-compose -f docker-compose.prod.yml up -d
                            """
                        }
                    }
                }
            }
        }
        
        stage('🧪 Post-Deploy Tests') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                script {
                    echo "Running post-deployment health checks..."
                    sh """
                        # Wait for application to start
                        sleep 30
                        
                        # Health check
                        curl -f http://localhost:3000/health || exit 1
                        
                        # API smoke test
                        curl -f http://localhost:3000/api || exit 1
                    """
                }
            }
        }
    }
    
    post {
        always {
            script {
                def status = currentBuild.result ?: 'SUCCESS'
                def color = status == 'SUCCESS' ? 'good' : 'danger'
                def message = """
                    Pipeline: ${env.JOB_NAME}
                    Build: ${env.BUILD_NUMBER}
                    Status: ${status}
                    Branch: ${env.BRANCH_NAME}
                    Duration: ${currentBuild.durationString}
                """
                
                slackSend(
                    channel: '#deployments',
                    color: color,
                    message: message,
                    teamDomain: 'your-team',
                    tokenCredentialId: 'slack-token'
                )
            }
        }
        success {
            echo "Pipeline completed successfully! 🎉"
        }
        failure {
            echo "Pipeline failed! 💥"
            emailext (
                subject: "Pipeline Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "The pipeline has failed. Please check the Jenkins console for details.",
                to: "dev-team@example.com"
            )
        }
        cleanup {
            deleteDir()
        }
    }
}
