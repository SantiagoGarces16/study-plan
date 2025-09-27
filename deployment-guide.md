# AWS EC2 Deployment Guide

This guide will help you deploy the Career Study Plan application to AWS EC2 using CloudFormation.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with your credentials
3. **EC2 Key Pair** created in your target region
4. **Gemini API Key** (optional, for AI suggestions)

## Step 1: Deploy Infrastructure

### Using AWS CLI
```bash
# Deploy the CloudFormation stack
aws cloudformation create-stack \
  --stack-name career-study-plan \
  --template-body file://cloudformation-template.yaml \
  --parameters ParameterKey=KeyPairName,ParameterValue=YOUR_KEY_PAIR_NAME \
               ParameterKey=GeminiApiKey,ParameterValue=YOUR_GEMINI_API_KEY \
  --capabilities CAPABILITY_IAM

# Check deployment status
aws cloudformation describe-stacks --stack-name career-study-plan
```

### Using AWS Console
1. Go to AWS CloudFormation console
2. Click "Create stack" → "With new resources"
3. Upload the `cloudformation-template.yaml` file
4. Fill in parameters:
   - **KeyPairName**: Your EC2 key pair name
   - **GeminiApiKey**: Your Gemini API key (optional)
   - **InstanceType**: t3.micro (default, free tier eligible)
5. Click through the wizard and create the stack

## Step 2: Get Instance Information

After the stack is created, get the public IP:

```bash
# Get the public IP
aws cloudformation describe-stacks \
  --stack-name career-study-plan \
  --query 'Stacks[0].Outputs[?OutputKey==`PublicIP`].OutputValue' \
  --output text
```

## Step 3: Automatic Deployment

The CloudFormation template automatically:
1. **Clones the repository** from https://github.com/SantiagoGarces16/study-plan
2. **Installs dependencies** for the Node.js server
3. **Configures environment** variables (Gemini API key if provided)
4. **Starts the application** using PM2 process manager
5. **Configures Nginx** as a reverse proxy
6. **Enables auto-startup** on system boot

No manual file upload is required! The deployment is fully automated.

## Step 4: Verify Deployment

Wait 2-3 minutes after stack creation completes, then check:

```bash
# SSH to the instance to verify deployment
ssh -i your-key.pem ec2-user@YOUR_PUBLIC_IP

# Check application status
pm2 status

# View deployment logs
sudo tail -f /var/log/cloud-init-output.log
```

## Step 5: Access Your Application

- **Application**: `http://YOUR_PUBLIC_IP/`
- **API**: `http://YOUR_PUBLIC_IP/api/`

## Application Management

### PM2 Commands
```bash
# Check application status
pm2 status

# View real-time logs
pm2 logs career-plan-server

# Restart application
pm2 restart career-plan-server

# Stop application
pm2 stop career-plan-server

# Monitor application
pm2 monit
```

### Update Application
```bash
# Update to latest version from GitHub
cd /opt/career-study-plan
sudo git pull origin main

# Restart if code changed
pm2 restart career-plan-server

# If dependencies changed
cd server
sudo npm install
pm2 restart career-plan-server
```

### Nginx Commands
```bash
# Check nginx status
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### System Monitoring
```bash
# Check running processes
ps aux | grep node

# Check port usage
sudo netstat -tlnp | grep -E '(3000|80)'

# Check system resources
htop
df -h
```

## Troubleshooting

### Common Issues

1. **Application not accessible**
   - Check security group allows port 80
   - Verify nginx is running: `sudo systemctl status nginx`
   - Check PM2 status: `pm2 status`

2. **API requests failing**
   - Check if Node.js server is running on port 3000
   - Verify nginx proxy configuration
   - Check application logs: `pm2 logs`

3. **File permissions issues**
   - Ensure proper ownership: `sudo chown -R ec2-user:ec2-user /opt/career-study-plan`
   - Check file permissions: `ls -la /opt/career-study-plan`

4. **Database issues**
   - Verify db.json exists and is writable
   - Check file permissions on db.json

### Log Locations
- **Application logs**: `pm2 logs career-plan-server`
- **Nginx access logs**: `/var/log/nginx/access.log`
- **Nginx error logs**: `/var/log/nginx/error.log`
- **System logs**: `/var/log/messages`

## Security Considerations

### Production Hardening
1. **Update security group** to restrict SSH access to your IP only
2. **Set up SSL/TLS** using Let's Encrypt or AWS Certificate Manager
3. **Configure firewall** rules
4. **Regular updates**: `sudo yum update -y`
5. **Monitor logs** for suspicious activity

### SSL Setup (Optional)
```bash
# Install certbot for Let's Encrypt
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Cleanup

To remove all resources:
```bash
aws cloudformation delete-stack --stack-name career-study-plan
```

## Cost Optimization

- **t3.micro** instance is free tier eligible (750 hours/month)
- **Stop instance** when not in use to save costs
- **Use Elastic IP** if you need a static IP (small charge when instance is stopped)
- **Monitor usage** with AWS Cost Explorer

## Scaling Considerations

For production use, consider:
- **Application Load Balancer** for high availability
- **Auto Scaling Group** for automatic scaling
- **RDS** for managed database instead of JSON files
- **CloudFront** for CDN and better performance
- **Route 53** for DNS management
## 🚀 Quick Deployment Options

### Option 1: Automated Script (Recommended)
```bash
# Linux/Mac
chmod +x deploy-to-aws.sh
./deploy-to-aws.sh
```

### Option 2: Windows Users
```cmd
# Run the Windows deployment script
deploy-to-aws.bat
```

### Option 3: Manual CloudFormation
```bash
# Deploy infrastructure only
aws cloudformation create-stack \
  --stack-name career-study-plan \
  --template-body file://cloudformation-template.yaml \
  --parameters file://cloudformation-parameters.json \
  --capabilities CAPABILITY_IAM

# Application automatically deploys from GitHub!
```

## 🔄 Updating Your Application

### Automated Update Scripts
```bash
# Linux/Mac
chmod +x update-app.sh
./update-app.sh

# Windows
update-app.bat
```

### Manual Update
```bash
# SSH to your instance
ssh -i your-key.pem ec2-user@YOUR_PUBLIC_IP

# Update application
cd /opt/career-study-plan
sudo git pull origin main
cd server
sudo npm install  # If dependencies changed
pm2 restart career-plan-server
```

## 🔧 Key Features

- **Fully Automated**: Deploys directly from GitHub repository
- **Production Ready**: Nginx reverse proxy, PM2 process management  
- **Secure**: Proper security groups and IAM roles
- **Scalable**: Easy to modify for load balancers and auto-scaling
- **Cost Effective**: Uses free tier eligible instance
- **Easy Updates**: Simple scripts to update from GitHub
- **Monitored**: Built-in logging and monitoring setup
- **Zero Manual Upload**: No need to package or upload files

## 📁 Repository Integration

The deployment automatically clones from:
**https://github.com/SantiagoGarces16/study-plan**

This means:
- ✅ No manual file uploads required
- ✅ Always deploys the latest code
- ✅ Easy updates with git pull
- ✅ Version control integration
- ✅ Consistent deployments