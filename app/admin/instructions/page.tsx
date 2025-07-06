import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AdminInstructionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <div className="mb-8">
          <Button asChild variant="outline">
            <Link href="/admin/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
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
            on the website's URL (e.g., <code>https://forms.visionradiology.com.au/admin/dashboard</code>).
          </p>

          <h2 className="text-2xl font-semibold mt-8">Dashboard Overview</h2>
          <p>The dashboard is organized into three main tabs that you will use for day-to-day operations:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>Brands:</strong> Manage all radiology brands, their details, and their specific order forms.
            </li>
            <li>
              <strong>Submissions:</strong> View, filter, and manage all completed order form submissions.
            </li>
            <li>
              <strong>Files:</strong> Upload and manage assets like brand logos and sample PDFs.
            </li>
          </ol>

          <hr className="my-8" />

          <h2 className="text-2xl font-semibold mt-8">1. Brand Management</h2>
          <p>
            This tab is your central hub for managing all the brands in the system. It displays a list of all brands,
            their status, and provides quick access to key actions.
          </p>
          <div className="my-4 p-2 border rounded-lg">
            <img
              src="/images/admin-brands.png"
              alt="Admin dashboard showing the list of brands"
              width={1200}
              height={750}
              className="rounded-md"
              style={{ maxWidth: "100%", height: "auto" }}
            />
          </div>
          <h3 className="text-xl font-semibold mt-6">Key Actions:</h3>
          <ul className="list-disc list-outside ml-6 space-y-2">
            <li>
              <strong>Add a Brand:</strong> Click the <strong>Add Brand</strong> button to open a dialog where you can
              enter a new brand's details.
            </li>
            <li>
              <strong>Edit a Brand:</strong> Click the <strong>Edit Brand</strong> button next to any brand to open a
              dialog and update its details.
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
          <p>When you add or edit a brand, you can configure the following in the pop-up dialog:</p>
          <ul className="list-disc list-outside ml-6 space-y-2">
            <li>
              <strong>Brand Name:</strong> The official name of the brand.
            </li>
            <li>
              <strong>Logo & Header Image:</strong> Select a previously uploaded image file to act as the brand's logo
              and header image on the order form.
            </li>
            <li>
              <strong>Recipient Emails:</strong> A list of email addresses that will receive the order notification and
              PDF when a user submits a form for this brand.
            </li>
            <li>
              <strong>Clinic Locations:</strong> A list of all physical clinics for this brand. For each location, you
              can specify its name, phone, address, and a specific email for that clinic.
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
            <img
              src="/images/form-editor.png"
              alt="The drag-and-drop form editor interface"
              width={1200}
              height={750}
              className="rounded-md"
              style={{ maxWidth: "100%", height: "auto" }}
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

          <h2 className="text-2xl font-semibold mt-8">3. Submissions Management</h2>
          <p>
            This tab provides a powerful, interactive table for viewing and managing every order that has been
            successfully submitted.
          </p>
          <h3 className="text-xl font-semibold mt-6">Filtering and Searching:</h3>
          <ul className="list-disc list-outside ml-6 space-y-2">
            <li>
              <strong>Global Search:</strong> Use the search bar at the top-left to instantly filter the table across
              all columns (e.g., by order number, name, or brand).
            </li>
            <li>
              <strong>Filter by Brand:</strong> Use the dropdown menu to show submissions for a specific brand.
            </li>
            <li>
              <strong>Filter by Status:</strong> Filter orders by their status: "Sent," "Failed," or "Completed."
            </li>
            <li>
              <strong>Filter by Date:</strong> Use the date range picker to view submissions from a specific period.
            </li>
          </ul>

          <h3 className="text-xl font-semibold mt-6">Table Interaction:</h3>
          <ul className="list-disc list-outside ml-6 space-y-2">
            <li>
              <strong>Sorting:</strong> Click on any column header (like "Order #", "Brand", or "Date") to sort the data
              in ascending or descending order.
            </li>
            <li>
              <strong>Pagination:</strong> Use the controls at the bottom of the table to navigate through pages of
              submissions. You can change the number of rows displayed per page (10, 20, 50, or 100) and jump directly
              to the first or last page.
            </li>
            <li>
              <strong>Refresh Data:</strong> Click the <strong>Refresh</strong> button to fetch the latest submissions
              without reloading the page.
            </li>
            <li>
              <strong>Export to CSV:</strong> Click the <strong>Export CSV</strong> button to download the currently
              filtered and sorted data as a CSV file.
            </li>
          </ul>

          <h3 className="text-xl font-semibold mt-6">Row Actions:</h3>
          <ul className="list-disc list-outside ml-6 space-y-2">
            <li>
              <strong>View Details:</strong> Opens a dialog with a complete summary of the order, including submitter
              details, addresses, and all ordered items.
            </li>
            <li>
              <strong>View PDF:</strong> Opens the exact PDF that was generated and emailed for that order in a new tab.
            </li>
            <li>
              <strong>Mark as Complete:</strong> For orders that are not yet completed, this button updates their
              status. This is useful for tracking which orders have been fully processed.
            </li>
          </ul>

          <hr className="my-8" />

          <h2 className="text-2xl font-semibold mt-8">4. File Management</h2>
          <p>This is your central library for all uploaded assets, such as brand logos and header images.</p>
          <ul className="list-disc list-outside ml-6 space-y-2">
            <li>
              <strong>Upload Files:</strong> Click <strong>Choose File</strong> to select and upload new images or other
              files.
            </li>
            <li>
              <strong>File Actions:</strong> For each file, you can:
              <ul className="list-['-_'] list-outside ml-6 mt-2 space-y-1">
                <li>
                  <strong>Copy URL:</strong> Copies the direct link to the file to your clipboard.
                </li>
                <li>
                  <strong>View:</strong> Opens the file in a new tab.
                </li>
                <li>
                  <strong>Delete:</strong> Permanently removes the file from the system.
                </li>
              </ul>
            </li>
          </ul>
        </article>
      </div>
    </div>
  )
}
