// Build/deploy steps are abstracted into jenkins-shared-library/vars/*.groovy,
// loaded via load() until the library is extracted into its own repo and
// registered as a Jenkins Global Pipeline Library (see
// jenkins-shared-library/README.md).
def lib = [:]

pipeline {
    agent {
        label 'terraform'
    }

    environment {
        TF_VERSION = '1.9.0'
        AWS_DEFAULT_REGION = 'us-east-1'
        TERRAFORM_DIR = 'terraform'
        DOCKER_IMAGE = 'very-prince-backend'
        // ─── Terraform state backend ────────────────────────────────────
        // These values must match terraform/backend.tf. Override per
        // environment if a different bucket or lock table is used.
        STATE_BUCKET_NAME = 'very-prince-terraform-state'
        DYNAMODB_LOCK_TABLE = 'very-prince-terraform-locks'
    }

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        ansiColor('xterm')
    }

    stages {
        stage('Setup') {
            steps {
                script {
                    lib.tfSetup             = load('jenkins-shared-library/vars/tfSetup.groovy')
                    lib.tfInit              = load('jenkins-shared-library/vars/tfInit.groovy')
                    lib.tfVerifyBackendLock = load('jenkins-shared-library/vars/tfVerifyBackendLock.groovy')
                    lib.tfValidate          = load('jenkins-shared-library/vars/tfValidate.groovy')
                    lib.tfPlan              = load('jenkins-shared-library/vars/tfPlan.groovy')
                    lib.tfApply             = load('jenkins-shared-library/vars/tfApply.groovy')
                    lib.dockerBuildImage    = load('jenkins-shared-library/vars/dockerBuildImage.groovy')
                    lib.trivyScanImage      = load('jenkins-shared-library/vars/trivyScanImage.groovy')

                    lib.tfSetup(tools: ['terraform', 'aws', 'docker', 'trivy'])
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    lib.dockerBuildImage(
                        dockerfile: 'packages/backend/Dockerfile',
                        imageName: env.DOCKER_IMAGE,
                        tag: env.BUILD_NUMBER
                    )
                }
            }
        }

        stage('Scan Docker Image') {
            steps {
                script {
                    lib.trivyScanImage(
                        imageName: env.DOCKER_IMAGE,
                        tag: env.BUILD_NUMBER
                    )
                }
            }
        }

        stage('Init') {
            steps {
                script {
                    lib.tfInit(
                        dir: env.TERRAFORM_DIR,
                        backendConfig: [
                            bucket: env.STATE_BUCKET_NAME,
                            dynamodb_table: env.DYNAMODB_LOCK_TABLE,
                            region: env.AWS_DEFAULT_REGION,
                            encrypt: 'true'
                        ]
                    )
                }
            }
        }

        stage('Verify Backend Lock') {
            steps {
                script {
                    lib.tfVerifyBackendLock(dir: env.TERRAFORM_DIR)
                }
            }
        }

        stage('Validate') {
            steps {
                script {
                    lib.tfValidate(dir: env.TERRAFORM_DIR)
                }
            }
        }

        stage('Plan') {
            steps {
                script {
                    lib.tfPlan(
                        dir: env.TERRAFORM_DIR,
                        planFile: 'tfplan',
                        stashName: 'tfplan',
                        lockTimeout: '300s'
                    )
                }
            }
        }

        stage('Apply') {
            when {
                branch 'main'
            }
            input {
                message 'Apply Terraform plan to production?'
                ok 'Apply'
                submitterParameter 'APPROVER'
            }
            steps {
                script {
                    lib.tfApply(
                        dir: env.TERRAFORM_DIR,
                        planFile: 'tfplan',
                        stashName: 'tfplan',
                        lockTimeout: '300s'
                    )
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully'
        }
        failure {
            echo 'Pipeline failed'
        }
    }
}
