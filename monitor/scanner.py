from .models import Keyword, ContentItem, Flag


def compute_score(keyword_text, title, body):
    title_lower = title.lower()
    body_lower = body.lower()
    keyword_lower = keyword_text.lower()

    # Exact match in title (full title equals keyword)
    if title_lower == keyword_lower:
        return 100
    # Partial match in title (keyword appears somewhere in title)
    elif keyword_lower in title_lower:
        return 70
    # Keyword appears only in body
    elif keyword_lower in body_lower:
        return 40
    else:
        return 0


def scan_content(content_item):
    keywords = Keyword.objects.all()
    flags_created = []

    for keyword in keywords:
        score = compute_score(
            keyword.name, content_item.title, content_item.body)

        if score > 0:
            flag, created = Flag.objects.get_or_create(
                keyword=keyword,
                content_item=content_item,
                defaults={'score': score, 'status': 'pending'}
            )

            if not created:
                if flag.status == 'irrelevant':
                    if (flag.reviewed_at and
                            content_item.last_updated > flag.reviewed_at):
                        flag.status = 'pending'
                        flag.score = score
                        flag.reviewed_at = None
                        flag.save()
                        flags_created.append(flag)
                    else:
                        continue
                else:
                    flag.score = score
                    flag.save()
                    flags_created.append(flag)
            else:
                flags_created.append(flag)

    return flags_created
