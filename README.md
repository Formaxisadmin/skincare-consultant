Skincare Consultation System - Setup Guide
This guide will walk you through setting up and running the Skincare Consultation System on your local machine for development purposes.

Prerequisites
Before you begin, ensure you have the following installed on your machine:

Node.js: v18.17 or later is recommended.

Git: For cloning the repository.

MongoDB Account: A free account from MongoDB Atlas is perfect for this. You will need a database to store consultation data.

Step 1: Clone the Repository
First, get the project code onto your computer. Open your terminal or command prompt and run the following commands:

# Clone the repository from GitHub
git clone [https://github.com/Formaxisadmin/skincare-consultant.git](https://github.com/Formaxisadmin/skincare-consultant.git)

# Navigate into the newly created project directory
cd skincare-consultant

Step 2: Install Project Dependencies
The project uses several libraries (like Next.js, React, and Mongoose) which are listed in the package.json file. You need to download and install them using Node Package Manager (npm).

In the project's root directory, run:

npm install

This command will read the package.json file and install all the necessary packages into a node_modules folder.

Step 3: Configure Environment Variables (The "Secrets")
Your application needs a way to securely connect to your database without exposing the password in the code. This is done using an environment file.

3a. Create your local environment file

The repository includes a template file called .env.example. You need to make a copy of this file and name it .env.local. This new file is ignored by Git, so your secrets will stay safe on your computer.

On Mac/Linux:

cp .env.example .env.local

On Windows:

copy .env.example .env.local

3b. Get your MongoDB Connection String

Log in to your MongoDB Atlas account.

If you don't have one, create a new cluster.

Find your cluster and click the "Connect" button.

Select "Drivers" (it may be labeled "Connect your application").

You will see a connection string that looks like this:
mongodb+srv://<username>:<password>@clustername.mongodb.net/?retryWrites=true&w=majority

Copy this string.

3c. Update your .env.local file

Now, open the .env.local file you created in your code editor. It will look like this:

# .env.local
MONGODB_URI=your_mongodb_connection_string_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SHOPIFY_STORE_URL=your-store.myshopify.com

Replace your_mongodb_connection_string_here with the string you copied from MongoDB Atlas.

Crucially, replace <password> with the actual password for your database user.

Add your database name before the ? at the end of the string. For example, skincare-db.

Your final string should look something like this:
MONGODB_URI=mongodb+srv://myuser:mypassword123@mycluster.mongodb.net/skincare-db?retryWrites=true&w=majority

Save the file. The NEXT_PUBLIC_APP_URL is already set correctly for local development.

Step 4: Run the Development Server
You are all set! The final step is to start the Next.js development server.

In your terminal, run the following command:

npm run dev

You should see output indicating that the server has started successfully.

✓ Ready in 5.2s
○ Compiling / ...
✓ Compiled / in 221ms
- Local:    http://localhost:3000

You can now open your web browser and navigate to http://localhost:3000 to see your application running live!

You have now successfully set up the Skincare Consultation System on your local machine. You can start exploring the code, making changes, and testing the features.

## 📚 Documentation

All project documentation is available in the [`docs/`](./docs/) folder:

- **[Complete Requirements](./docs/COMPLETE_RECOMMENDATION_REQUIREMENTS.md)** - Implementation plan and requirements
- **[Database Schema](./docs/DATABASE_SCHEMA.md)** - Database schema documentation
- **[Excel Template](./docs/EXCEL_TEMPLATE_REQUIREMENTS.md)** - Data import template requirements
- **[Shopify Setup](./docs/SHOPIFY_API_SETUP_GUIDE.md)** - Shopify integration guide
- **[Implementation Status](./docs/TODO_LIST_STATUS.md)** - Current implementation status

See the [docs/README.md](./docs/README.md) for a complete documentation index.