interface TicketCardProps {
  venue: string;
  date: string;
  price: number;
  section: string;
  row: string;
  quantity: number;
  sellerName: string;
}

export default function TicketCard({
  venue,
  date,
  price,
  section,
  row,
  quantity,
  sellerName,
}: TicketCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{venue}</h3>
            <p className="text-gray-600">{new Date(date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-600">${price}</p>
            <p className="text-sm text-gray-500">per ticket</p>
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <p className="text-gray-700">
            <span className="font-semibold">Section:</span> {section}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Row:</span> {row}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Quantity:</span> {quantity} tickets
          </p>
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Sold by {sellerName}
          </p>
          <button className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition-colors duration-300">
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
} 