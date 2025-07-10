import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
/* eslint react/no-unescaped-entities: off */

export default function AdminInstructionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <div className="mb-8">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <article className="prose prose-blue max-w-none">
          <h1 className="text-3xl font-bold mb-6 border-b pb-4">
            Admin Guide: Managing the Printing Order Form System
          </h1>
          <p>
            This guide provides a complete overview of how to use the admin dashboard to manage brands, forms,
            submissions, and system settings.
          </p>

          <h2 className="text-2xl font-semibold mt-8">Accessing the Dashboard</h2>
          <p>
            You can access the admin panel by navigating to{" "}
            <Link href="/admin/dashboard" className="font-mono bg-gray-100 p-1 rounded">
              /admin/dashboard
            </Link>{" "}
            on the website's URL (e.g., <code>https://your-website.com/admin/dashboard</code>).
          </p>

          <h2 className="text-2xl font-semibold mt-8">Dashboard Overview</h2>
          <p>The dashboard is organized into four main tabs:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>Brands:</strong> Manage all the radiology brands, their details, and their specific order forms.
            </li>
            <li>
              <strong>Submissions:</strong> View a log of all completed order form submissions from users.
            </li>
            <li>
              <strong>Files:</strong> Upload and manage assets like brand logos and sample PDFs.
            </li>
            <li>
              <strong>System Actions:</strong> Perform critical database setup and maintenance tasks.
            </li>
          </ol>

          <hr className="my-8" />

          <h2 className="text-2xl font-semibold mt-8">1. Brand Management</h2>
          <p>This is where you'll spend most of your time. This tab lists all the brands in the system.</p>
          <div className="my-4 p-2 border rounded-lg">
            <Image
              src="/images/admin-brands.png"
              alt="Admin dashboard showing the list of brands"
              width={1200}
              height={750}
              className="rounded-md"
            />
          </div>
          <h3 className="text-xl font-semibold mt-6">Key Actions:</h3>
          <ul className="list-disc list-outside ml-6 space-y-2">
            <li>
              <strong>Add a Brand:</strong> Click the <strong>Add Brand</strong> button. This opens a form where you can
              enter the brand's name, upload a logo, set recipient emails for orders, and define clinic locations.
            </li>
            <li>
              <strong>Edit a Brand:</strong> Click the <strong>Edit Brand</strong> button next to any brand. This opens
              the same form, allowing you to update its details.
            </li>
            <li>
              <strong>Edit a Form:</strong> Click the <strong>Edit Form</strong> button to go to the visual
              drag-and-drop editor for that specific brand's order form.
            </li>
            <li>
              <strong>View a Form:</strong> Click <strong>View Form</strong> to open the live, public order form for
              that brand in a new tab.
            </li>
            <li>
              <strong>Delete a Brand:</strong> Click the <strong>trash can icon</strong> to permanently delete a brand
              and all its associated form fields. This action cannot be undone.
            </li>
          </ul>

          <h3 className="text-xl font-semibold mt-6">Editing Brand Details</h3>
          <p>When you add or edit a brand, you can configure the following:</p>
          <ul className="list-disc list-outside ml-6 space-y-2">
            <li>
              <strong>Brand Name:</strong> The official name of the brand.
            </li>
            <li>
              <strong>Logo:</strong> Select a previously uploaded image file to act as the brand's logo on the order
              form. You can also upload a new one directly from this screen.
            </li>
            <li>
              <strong>Recipient Emails:</strong> A list of email addresses that will receive the order notification and
              PDF when a user submits a form for this brand.
            </li>
            <li>
              <strong>Clinic Locations:</strong> A list of all physical clinics for this brand. For each location, you
              can specify:
              <ul className="list-['-_'] list-outside ml-6 mt-2 space-y-1">
                <li>
                  <strong>Location Name:</strong> The name of the clinic (e.g., "Main Street Clinic").
                </li>
                <li>
                  <strong>Phone Number:</strong> The clinic's contact number.
                </li>
                <li>
                  <strong>Address:</strong> The full physical address.
                </li>
                <li>
                  <strong>Email:</strong> The specific email for that clinic. When a user selects this clinic in the
                  "Deliver To" field on the order form, their email field will be auto-filled with this address.
                </li>
              </ul>
            </li>
            <li>
              <strong>Active Brand:</strong> An active brand will appear on the homepage and its form will be
              accessible. Inactive brands are hidden from public view.
            </li>
          </ul>

          <hr className="my-8" />

          <h2 className="text-2xl font-semibold mt-8">2. The Form Editor</h2>
          <p>
            The Form Editor is a powerful drag-and-drop interface for building and organizing the order form for a
            specific brand.
          </p>
          <div className="my-4 p-2 border rounded-lg">
            <Image
              src="/images/form-editor.png"
              alt="The drag-and-drop form editor interface"
              width={1200}
              height={750}
              className="rounded-md"
            />
          </div>
          <h3 className="text-xl font-semibold mt-6">Key Concepts:</h3>
          <ul className="list-disc list-outside ml-6 space-y-2">
            <li>
              <strong>Sections:</strong> These are collapsible containers used to group related items (e.g., "Referral
              Pads," "Patient Brochures"). You can add, edit, delete, and reorder entire sections.
            </li>
            <li>
              <strong>Items (Fields):</strong> These are the individual form fields within a section. You can add, edit,
              delete, and reorder items.
            </li>
          </ul>

          <h3 className="text-xl font-semibold mt-6">Workflow:</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>Add a Section:</strong> Click <strong>Add Section</strong> to create a new group. Give it a
              descriptive title.
            </li>
            <li>
              <strong>Add Items to a Section:</strong> Inside a section, click one of the buttons like{" "}
              <strong>Checkbox Group</strong> or <strong>Text Input</strong> to add a new field.
            </li>
            <li>
              <strong>Configure Items:</strong> When adding or editing an item, you can set its label, code, options,
              and whether it's a required field.
            </li>
            <li>
              <strong>Reorder:</strong> Simply click and drag sections or items up and down to change their order on the
              form.
            </li>
            <li>
              <strong>Import from Jotform:</strong> If you have an existing form on Jotform, you can paste its full HTML
              source code here to automatically build the form structure, saving significant time.
            </li>
          </ol>

          <hr className="my-8" />

          <h2 className="text-2xl font-semibold mt-8">3. Submissions</h2>
          <p>
            This tab provides a read-only log of every order that has been successfully submitted through the forms. You
            can see who ordered, when, for which brand, and whether the notification email was sent successfully.
          </p>
          <ul className="list-disc list-outside ml-6 space-y-2">
            <li>
              <strong>View PDF:</strong> Click the <strong>View PDF</strong> button to see the exact PDF that was
              generated and emailed for that order.
            </li>
          </ul>

          <hr className="my-8" />

          <h2 className="text-2xl font-semibold mt-8">4. Files</h2>
          <p>This is your central library for all uploaded assets.</p>
          <ul className="list-disc list-outside ml-6 space-y-2">
            <li>
              <strong>Upload Files:</strong> Click <strong>Upload File(s)</strong> to add new logos or sample PDFs.
            </li>
            <li>
              <strong>Auto-assign PDF Links:</strong> A powerful time-saver. This tool scans all your uploaded files. If
              a file's name starts with an item's <strong>Code</strong> (e.g., file <code>A4-REF.pdf</code> and item
              with code <code>A4-REF</code>), it will automatically link that PDF as the item's sample link.
            </li>
            <li>
              <strong>File Actions:</strong> For each file, you can view, download, copy its URL, or delete it.
            </li>
          </ul>

          <hr className="my-8" />

          <h2 className="text-2xl font-semibold mt-8">5. System Actions</h2>
          <p>
            This tab contains critical, one-time, or periodic maintenance tasks.{" "}
            <strong>It is very important to understand what these do.</strong>
          </p>
          <div className="my-4 p-2 border rounded-lg">
            <Image
              src="/images/system-actions.png"
              alt="The System Actions tab with several database management buttons"
              width={1200}
              height={750}
              className="rounded-md"
            />
          </div>
          <h3 className="text-xl font-semibold mt-6">Recommended Initial Setup Workflow</h3>
          <p>If you are setting up the system for the first time, follow these steps in order:</p>
          <ol className="list-decimal list-inside space-y-4">
            <li>
              <strong>Initialize Database:</strong>
              <ul className="list-['-_'] list-outside ml-6 mt-2 space-y-1 text-gray-700">
                <li>
                  <strong>What it does:</strong> <strong>Deletes all existing data</strong> and creates 5 blank brands.
                </li>
                <li>
                  <strong>When to use it:</strong> Only on a completely fresh install or if you want to start over from
                  scratch.
                </li>
              </ul>
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  This action is destructive and cannot be undone. It will wipe all brands, forms, and submissions.
                </AlertDescription>
              </Alert>
            </li>
            <li>
              <strong>Import Clinic Data:</strong>
              <ul className="list-['-_'] list-outside ml-6 mt-2 space-y-1 text-gray-700">
                <li>
                  <strong>What it does:</strong> Fetches the latest data from the master CSV file and updates all brands
                  with their correct logos, recipient emails, and full clinic location details.
                </li>
                <li>
                  <strong>When to use it:</strong> After initializing the database, and any time the central CSV file
                  with clinic information is updated.
                </li>
              </ul>
            </li>
            <li>
              <strong>Force Schema Reload:</strong>
              <ul className="list-['-_'] list-outside ml-6 mt-2 space-y-1 text-gray-700">
                <li>
                  <strong>What it does:</strong> Clears a temporary cache in the database.
                </li>
                <li>
                  <strong>When to use it:</strong> If you've just run an import or made a change and the data doesn't
                  seem to be showing up correctly on the live forms, running this can often fix the issue. It's a safe
                  action to perform.
                </li>
              </ul>
            </li>
          </ol>
        </article>
      </div>
    </div>
  )
}
