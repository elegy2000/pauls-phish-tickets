export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Paul's Phish Tickets</h3>
            <p className="text-gray-400">
              Your trusted source for Phish concert tickets.
              Buy and sell with confidence in our community.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Contact</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Email: support@paulsphishtickets.com</li>
              <li>Phone: (555) 123-4567</li>
              <li>Hours: Mon-Fri 9am-5pm EST</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Paul's Phish Tickets. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 